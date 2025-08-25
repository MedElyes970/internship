"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar, Hash } from "lucide-react";
import { getCategories, deleteCategory, Category } from "@/lib/categories";
import { toast } from "sonner";
import AddCategory from "@/components/AddCategory";
import EditCategory from "@/components/EditCategory";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) {
      return;
    }

    try {
      await deleteCategory(id);
      toast.success(`Category "${name}" deleted successfully`);
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error("Failed to delete category");
    }
  };

  const handleAddSuccess = () => {
    setIsAddSheetOpen(false);
    fetchCategories(); // Refresh the list
  };

  const handleEditSuccess = () => {
    setIsEditSheetOpen(false);
    setSelectedCategory(null);
    fetchCategories(); // Refresh the list
  };

  const handleEditCancel = () => {
    setIsEditSheetOpen(false);
    setSelectedCategory(null);
  };

  const openEditSheet = (category: Category) => {
    setSelectedCategory(category);
    setIsEditSheetOpen(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage product categories for your store
          </p>
        </div>
        
        <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </SheetTrigger>
          <SheetContent>
            <AddCategory onSuccess={handleAddSuccess} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Hash className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first category to organize your products.
            </p>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {category.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {category.slug}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created: {formatDate(category.createdAt)}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openEditSheet(category)}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCategory(category.id!, category.name)}
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

      {/* Edit Category Sheet */}
      {selectedCategory && (
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetContent>
            <EditCategory 
              category={selectedCategory}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Category Statistics</CardTitle>
          <CardDescription>Overview of your category management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-sm text-muted-foreground">Total Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {categories.filter(cat => cat.description).length}
              </div>
              <div className="text-sm text-muted-foreground">With Description</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {categories.length > 0 ? formatDate(categories[0].createdAt) : "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">Latest Added</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
