"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar, Package, Search, Filter } from "lucide-react";
import { getProducts, deleteProduct, Product, getStockStatusColor, getStockStatusText } from "@/lib/products";
import { getCategoriesWithSubcategories } from "@/lib/categories";
import { toast } from "sonner";
import AddProduct from "@/components/AddProduct";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search term and category
  useEffect(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the product "${name}"?`)) {
      return;
    }

    try {
      await deleteProduct(id);
      toast.success(`Product "${name}" deleted successfully`);
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error("Failed to delete product");
    }
  };

  const handleAddSuccess = () => {
    setIsAddSheetOpen(false);
    fetchProducts(); // Refresh the list
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Get categories from database
  const [categories, setCategories] = useState<string[]>(["all"]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategoriesWithSubcategories();
        const categoryNames = data.map(cat => cat.name).filter(Boolean);
        setCategories(["all", ...categoryNames]);
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to product-derived categories
        const productCategories = Array.from(new Set(products.map(p => p.category || "").filter(Boolean)));
        setCategories(["all", ...productCategories]);
      }
    };
    fetchCategories();
  }, [products]);

  if (loading) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading products...</p>
      </div>
    </div>
  );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        
        <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </SheetTrigger>
          <SheetContent>
            <AddProduct onSuccess={handleAddSuccess} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || selectedCategory !== "all" ? "No products found" : "No products yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedCategory !== "all" 
                ? "Try adjusting your search or filters."
                : "Get started by creating your first product."
              }
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <Button onClick={() => setIsAddSheetOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {product.description || "No description"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Product Image */}
                {product.images && product.images.length > 0 && (
                  <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Price and Stock */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    {product.hasDiscount && product.discountPercentage && product.discountPercentage > 0 ? (
                      <>
                        <span className="text-lg font-bold text-green-600">
                          ${(product.discountedPrice || product.price).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.price.toFixed(2)}
                        </span>
                        <Badge variant="destructive" className="text-xs w-fit">
                          {product.discountPercentage}% OFF
                        </Badge>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getStockStatusColor(product.stockStatus)}`}
                  >
                    {getStockStatusText(product.stockStatus)}
                  </Badge>
                </div>

                {/* Category and Brand */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {product.category && (
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  )}
                  {product.brand && (
                    <Badge variant="outline" className="text-xs">
                      {product.brand}
                    </Badge>
                  )}
                </div>

                {/* Stock Quantity */}
                {product.stock !== undefined && (
                  <div className="text-sm text-muted-foreground">
                    Stock: {product.stock} units
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Created: {formatDate(product.createdAt)}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteProduct(product.id!, product.name)}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Product Statistics</CardTitle>
          <CardDescription>Overview of your product catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{products.length}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {products.filter(p => p.stock && p.stock > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">In Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {products.filter(p => p.category).length}
              </div>
              <div className="text-sm text-muted-foreground">With Category</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {products.filter(p => p.hasDiscount && p.discountPercentage && p.discountPercentage > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">With Discount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {products.length > 0 ? formatDate(products[0].createdAt) : "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">Latest Added</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
