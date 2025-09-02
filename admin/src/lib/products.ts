import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  increment,
  getDoc,
  setDoc,
  runTransaction, 
  deleteField 
} from 'firebase/firestore';

export interface Product {
  id?: string;
  reference?: string | number; // Changed from number to string | number
  name: string;
  description?: string;
  price: number;
  category?: string;
  subcategory?: string;
  brand?: string;
  images?: string[];
  unlimited?: boolean;
  stock?: number;
  stockStatus?: 'in-stock' | 'sur-commande' | 'out-of-stock';
  createdAt?: any;
  updatedAt?: any;
  specs?: Record<string, any>;
  salesCount?: number;
  // Discount system fields
  hasDiscount?: boolean;
  discountPercentage?: number;
  originalPrice?: number;
  discountedPrice?: number;
  discountEndDate?: any;
  // Video URL for surveillance cameras
  videoUrl?: string;
}

const COLLECTION_NAME = 'products';
const COUNTERS_COLLECTION = 'counters';
const PRODUCT_REFERENCE_DOC = 'productReference';

// Get next product reference atomically (increments and returns new value)
export const getNextProductReference = async (): Promise<number> => {
  const counterRef = doc(collection(db, COUNTERS_COLLECTION), PRODUCT_REFERENCE_DOC);
  const nextValue = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const current = snapshot.exists() ? (snapshot.data().current as number) : 0;
    const updated = (Number.isFinite(current) ? current : 0) + 1;
    if (snapshot.exists()) {
      transaction.update(counterRef, { current: updated, updatedAt: serverTimestamp() });
    } else {
      transaction.set(counterRef, { current: updated, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    return updated;
  });
  return nextValue;
};

// Read-only preview of the next product reference (does not increment)
export const getNextProductReferencePreview = async (): Promise<number> => {
  try {
    const counterRef = doc(collection(db, COUNTERS_COLLECTION), PRODUCT_REFERENCE_DOC);
    const snapshot = await getDoc(counterRef);
    const current = snapshot.exists() ? (snapshot.data().current as number) : 0;
    const next = (Number.isFinite(current) ? current : 0) + 1;
    return next;
  } catch (error) {
    return 1;
  }
};

// Add a new product
export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    // Validate input
    if (!productData.name) {
      throw new Error('Product name is required');
    }

    if (!productData.price || productData.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    if (productData.name.length > 100) {
      throw new Error('Product name must be less than 100 characters');
    }

    if (productData.description && productData.description.length > 1000) {
      throw new Error('Description must be less than 1000 characters');
    }

    if (!productData.unlimited && productData.stock !== undefined && productData.stock < 0) {
      throw new Error('Stock cannot be negative');
    }

    // Set default stock status based on stock if not provided
    let stockStatus = productData.stockStatus;
    if (!productData.unlimited) {
      if (!stockStatus && productData.stock !== undefined) {
        if (productData.stock === 0) {
          stockStatus = 'out-of-stock';
        } else if (productData.stock <= 10) {
          stockStatus = 'sur-commande';
        } else {
          stockStatus = 'in-stock';
        }
      }
    } else {
      // For unlimited products, ignore stock and status
      stockStatus = 'in-stock';
    }

    // Handle discount calculations
    let discountData = {};
    if (productData.hasDiscount && productData.discountPercentage && productData.discountPercentage > 0) {
      const originalPrice = productData.price;
      const discountedPrice = Math.round((originalPrice * (100 - productData.discountPercentage)) / 100 * 100) / 100;
      
      discountData = {
        hasDiscount: true,
        discountPercentage: productData.discountPercentage,
        originalPrice: originalPrice,
        discountedPrice: discountedPrice,
        discountEndDate: productData.discountEndDate || null,
      };
    } else {
      discountData = {
        hasDiscount: false,
        discountPercentage: 0,
        originalPrice: productData.price,
        discountedPrice: productData.price,
        discountEndDate: null,
      };
    }

    // Determine reference (auto-increment if not provided, or use provided string/number)
    let referenceValue: string | number;
    if (productData.reference !== undefined && productData.reference !== null && productData.reference !== '') {
      // Use provided reference (string or number)
      referenceValue = productData.reference;
    } else {
      // Auto-increment numeric reference
      referenceValue = await getNextProductReference();
    }

    // Build document without undefined fields
    const { stock: incomingStock, ...productDataWithoutStock } = productData as any;
    
    // Filter out undefined values from productDataWithoutStock
    const filteredProductData = Object.fromEntries(
      Object.entries(productDataWithoutStock).filter(([_, value]) => value !== undefined)
    );
    
    const docData: any = {
      ...filteredProductData,
      unlimited: Boolean(productData.unlimited),
      ...discountData,
      reference: referenceValue,
      stockStatus,
      salesCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (!productData.unlimited && typeof incomingStock === 'number') {
      docData.stock = incomingStock;
    }
    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
    
    return {
      id: docRef.id,
      ...productData,
      unlimited: Boolean(productData.unlimited),
      ...discountData,
      reference: referenceValue,
      stockStatus,
      salesCount: 0,
    };
  } catch (error) {
    console.error('Error adding product:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to add product');
  }
};

// Get all products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error) {
    console.error('Error getting products:', error);
    throw new Error('Failed to get products');
  }
};

// Get products by category
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error) {
    console.error('Error getting products by category:', error);
    throw new Error('Failed to get products by category');
  }
};

// Get products by brand
export const getProductsByBrand = async (brand: string): Promise<Product[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('brand', '==', brand),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  } catch (error) {
    console.error('Error getting products by brand:', error);
    throw new Error('Failed to get products by brand');
  }
};

// Update a product
export const updateProduct = async (id: string, updates: Partial<Product>) => {
  try {
    if (!id) {
      throw new Error('Product ID is required');
    }

    // Validate updates
    if (updates.name && updates.name.length > 100) {
      throw new Error('Product name must be less than 100 characters');
    }

    if (updates.description && updates.description.length > 1000) {
      throw new Error('Description must be less than 1000 characters');
    }

    if (updates.price !== undefined && updates.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    if (!updates.unlimited && updates.stock !== undefined && updates.stock < 0) {
      throw new Error('Stock cannot be negative');
    }

    // Update stock status if stock is being updated and no manual status provided
    if (!updates.unlimited) {
      if (updates.stock !== undefined && !updates.stockStatus) {
        if (updates.stock === 0) {
          updates.stockStatus = 'out-of-stock';
        } else if (updates.stock <= 10) {
          updates.stockStatus = 'sur-commande';
        } else {
          updates.stockStatus = 'in-stock';
        }
      }
    } else {
      // If setting to unlimited, remove stock and set status to in-stock by default
      // Use deleteField to remove stock
      (updates as any).stock = deleteField();
      updates.stockStatus = 'in-stock';
    }

    const productRef = doc(db, COLLECTION_NAME, id);

    // Ensure backend-managed fields cannot be modified here
    const { salesCount: _ignoredSalesCount, createdAt: _ignoreCreatedAt, ...safeUpdates } = updates as any;

    // Filter out undefined values from safeUpdates
    const filteredUpdates = Object.fromEntries(
      Object.entries(safeUpdates).filter(([_, value]) => value !== undefined)
    );

    // Prevent sending undefined values by constructing payload explicitly
    const payload: any = {
      ...filteredUpdates,
      unlimited: Boolean((updates as any).unlimited),
      updatedAt: serverTimestamp(),
    };
    if ((updates as any).stock === deleteField()) {
      payload.stock = deleteField();
    } else if (safeUpdates.stock === undefined) {
      delete payload.stock;
    }
    await updateDoc(productRef, payload);
    
    return { id, ...updates };
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
  }
};

// Atomically increment salesCount (backend-managed)
export const incrementSalesCount = async (id: string, amount: number = 1) => {
  try {
    if (!id) {
      throw new Error('Product ID is required');
    }
    if (!Number.isFinite(amount)) {
      throw new Error('Increment amount must be a finite number');
    }
    const productRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(productRef, {
      salesCount: increment(amount),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error incrementing salesCount:', error);
    throw new Error('Failed to increment sales count');
  }
};

// Delete a product
export const deleteProduct = async (id: string) => {
  try {
    if (!id) {
      throw new Error('Product ID is required');
    }

    const productRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(productRef);
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product');
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    if (!id) return null;
    
    const products = await getProducts();
    return products.find(product => product.id === id) || null;
  } catch (error) {
    console.error('Error getting product by ID:', error);
    return null;
  }
};

// Search products
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  try {
    if (!searchTerm) return [];
    
    const products = await getProducts();
    const term = searchTerm.toLowerCase();
    
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.brand?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

// Get popular products by sales count
export const getPopularProducts = async (limit: number = 5): Promise<Product[]> => {
  try {
    console.log('Fetching popular products...');
    
    // Use a single orderBy to avoid composite index issues
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy('salesCount', 'desc')
    );
    
    console.log('Query created, executing...');
    const querySnapshot = await getDocs(q);
    console.log(`Query returned ${querySnapshot.docs.length} documents`);
    
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    
    console.log('Products mapped:', products.map(p => ({ id: p.id, name: p.name, salesCount: p.salesCount })));
    
    // Filter out products with no sales, sort by sales count, then by creation date
    const popularProducts = products
      .filter(product => (product.salesCount || 0) > 0)
      .sort((a, b) => {
        // Primary sort by sales count (descending)
        const salesDiff = (b.salesCount || 0) - (a.salesCount || 0);
        if (salesDiff !== 0) return salesDiff;
        
        // Secondary sort by creation date (descending) for products with same sales count
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
    
    console.log(`Filtered to ${popularProducts.length} products with sales > 0`);
    console.log('Final popular products:', popularProducts.map(p => ({ id: p.id, name: p.name, salesCount: p.salesCount })));
    
    return popularProducts;
  } catch (error) {
    console.error('Error getting popular products with orderBy:', error);
    
    // Fallback: fetch all products and sort in JavaScript
    try {
      console.log('Falling back to fetching all products...');
      const allProducts = await getProducts();
      
      const popularProducts = allProducts
        .filter(product => (product.salesCount || 0) > 0)
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
        .slice(0, limit);
      
      console.log(`Fallback returned ${popularProducts.length} products`);
      return popularProducts;
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error(`Failed to get popular products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// Get stock status color
export const getStockStatusColor = (status: string | undefined) => {
  switch (status) {
    case 'in-stock':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'sur-commande':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'out-of-stock':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

// Get stock status text
export const getStockStatusText = (status: string | undefined) => {
  switch (status) {
    case 'in-stock':
      return 'In Stock';
    case 'sur-commande':
      return 'Sur Commande';
    case 'out-of-stock':
      return 'Out of Stock';
    default:
      return 'Unknown';
  }
};

// Check if discount is still valid (not expired)
export const isDiscountValid = (product: Product): boolean => {
  if (!product.hasDiscount || !product.discountEndDate) {
    return false;
  }
  
  const now = new Date();
  const endDate = product.discountEndDate.toDate ? product.discountEndDate.toDate() : new Date(product.discountEndDate);
  
  return now < endDate;
};

// Get current price (discounted if valid, original if not)
export const getCurrentPrice = (product: Product): number => {
  if (product.hasDiscount && isDiscountValid(product)) {
    return product.discountedPrice || product.price;
  }
  return product.price;
};

// Helper function to format price in Tunisian format (no decimals, comma separator)
export const formatPrice = (price: number): string => {
  // Convert price from millimes to dinars (divide by 1000)
  const priceInDinars = price / 1000;
  return new Intl.NumberFormat('ar-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(priceInDinars);
};

// Get latest orders
export const getLatestOrders = async (limit: number = 5): Promise<Array<{
  id: string;
  orderNumber: number;
  userId: string;
  total: number;
  status: string;
  createdAt: any;
  customerName?: string;
  customerEmail?: string;
  items?: any[];
  shippingInfo?: any;
}>> => {
  try {
    console.log('Fetching latest orders...');
    
    const q = query(
      collection(db, 'orders'), 
      orderBy('createdAt', 'desc')
    );
    
    console.log('Orders query created, executing...');
    const querySnapshot = await getDocs(q);
    console.log(`Orders query returned ${querySnapshot.docs.length} documents`);
    
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        orderNumber: data.orderNumber || 0,
        userId: data.userId || '',
        total: data.total || 0,
        status: data.status || 'pending',
        createdAt: data.createdAt,
        customerName: data.shippingInfo?.name || 'Unknown Customer',
        customerEmail: data.shippingInfo?.email || 'No Email',
        items: data.items || [],
        shippingInfo: data.shippingInfo || {}
      };
    });
    
    console.log('Orders mapped:', orders.map(o => ({ 
      id: o.id, 
      orderNumber: o.orderNumber, 
      customerName: o.customerName,
      total: o.total,
      itemsCount: o.items?.length || 0
    })));
    
    // Return the latest orders up to the limit
    const latestOrders = orders.slice(0, limit);
    console.log(`Returning ${latestOrders.length} latest orders`);
    
    return latestOrders;
  } catch (error) {
    console.error('Error getting latest orders:', error);
    throw new Error(`Failed to get latest orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Update order status
export const updateOrderStatus = async (orderId: string, newStatus: string): Promise<boolean> => {
  try {
    console.log(`Updating order ${orderId} status to ${newStatus}`);
    
    const orderRef = doc(db, 'orders', orderId);
    
    // Update the order status
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    
    console.log(`Order ${orderId} status updated successfully to ${newStatus}`);
    return true;
  } catch (error) {
    console.error(`Error updating order ${orderId} status:`, error);
    throw new Error(`Failed to update order status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get category sales data for charts
export const getCategorySalesData = async (limit: number = 6): Promise<Array<{
  category: string;
  totalSales: number;
  productCount: number;
}>> => {
  try {
    console.log('Fetching category sales data...');
    
    const products = await getProducts();
    console.log(`Retrieved ${products.length} products`);
    
    // Group products by category and calculate total sales
    const categoryMap = new Map<string, { totalSales: number; productCount: number }>();
    
    products.forEach(product => {
      if (product.category) {
        const salesCount = product.salesCount || 0;
        const existing = categoryMap.get(product.category) || { totalSales: 0, productCount: 0 };
        
        categoryMap.set(product.category, {
          totalSales: existing.totalSales + salesCount,
          productCount: existing.productCount + 1
        });
      }
    });
    
    // Convert to array and sort by total sales
    const categoryData = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        totalSales: data.totalSales,
        productCount: data.productCount
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit);
    
    console.log('Category sales data:', categoryData);
    return categoryData;
  } catch (error) {
    console.error('Error getting category sales data:', error);
    throw new Error(`Failed to get category sales data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get monthly sales trend data
export const getMonthlySalesTrend = async (months: number = 6): Promise<Array<{
  month: string;
  totalSales: number;
  newProducts: number;
}>> => {
  try {
    console.log('Fetching monthly sales trend data...');
    
    const products = await getProducts();
    console.log(`Retrieved ${products.length} products for trend analysis`);
    
    // Generate last 6 months
    const monthsData = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Filter products created in this month
      const productsInMonth = products.filter(product => {
        if (!product.createdAt) return false;
        
        const productDate = product.createdAt.toDate ? product.createdAt.toDate() : new Date(product.createdAt);
        const productMonth = `${productDate.getFullYear()}-${String(productDate.getMonth() + 1).padStart(2, '0')}`;
        
        return productMonth === monthKey;
      });
      
      // Calculate total sales for products created in this month
      const totalSales = productsInMonth.reduce((sum, product) => sum + (product.salesCount || 0), 0);
      
      monthsData.push({
        month: monthName,
        totalSales,
        newProducts: productsInMonth.length
      });
    }
    
    console.log('Monthly sales trend data:', monthsData);
    return monthsData;
  } catch (error) {
    console.error('Error getting monthly sales trend:', error);
    throw new Error(`Failed to get monthly sales trend: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};