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
  where 
} from 'firebase/firestore';

export interface Product {
  id?: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  brand?: string;
  images?: string[];
  stock?: number;
  stockStatus?: 'in-stock' | 'sur-commande' | 'out-of-stock';
  createdAt?: any;
  updatedAt?: any;
  specs?: Record<string, any>;
}

const COLLECTION_NAME = 'products';

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

    if (productData.stock !== undefined && productData.stock < 0) {
      throw new Error('Stock cannot be negative');
    }

    // Set default stock status based on stock if not provided
    let stockStatus = productData.stockStatus;
    if (!stockStatus && productData.stock !== undefined) {
      if (productData.stock === 0) {
        stockStatus = 'out-of-stock';
      } else if (productData.stock <= 10) {
        stockStatus = 'sur-commande';
      } else {
        stockStatus = 'in-stock';
      }
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...productData,
      stockStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return {
      id: docRef.id,
      ...productData,
      stockStatus,
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

    if (updates.stock !== undefined && updates.stock < 0) {
      throw new Error('Stock cannot be negative');
    }

    // Update stock status if stock is being updated and no manual status provided
    if (updates.stock !== undefined && !updates.stockStatus) {
      if (updates.stock === 0) {
        updates.stockStatus = 'out-of-stock';
      } else if (updates.stock <= 10) {
        updates.stockStatus = 'sur-commande';
      } else {
        updates.stockStatus = 'in-stock';
      }
    }

    const productRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    return { id, ...updates };
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
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
