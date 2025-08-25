"use client";

import { useState, useEffect } from "react";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { addProduct, Product } from "@/lib/products";
import { getCategories, getSubcategoriesByCategoryId, Category, Subcategory } from "@/lib/categories";
import { Loader2, CheckCircle, AlertCircle, Plus, X } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Product name is required!" })
    .max(100, { message: "Name must be less than 100 characters" }),
  description: z.string().optional(),
  price: z.number().min(0.01, { message: "Price must be greater than 0" }),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  stock: z.number().min(0, { message: "Stock cannot be negative" }).optional(),
  stockStatus: z.enum(["in-stock", "sur-commande", "out-of-stock"]).optional(),
  images: z.array(z.string()).optional(),
  specs: z.record(z.any()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddProductProps {
  onSuccess?: () => void;
}

const AddProduct = ({ onSuccess }: AddProductProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [specs, setSpecs] = useState<Record<string, any>>({});
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      subcategory: "",
      brand: "",
      stock: 0,
      stockStatus: "in-stock",
      images: [],
      specs: {},
    },
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  const selectedCategory = form.watch("category");
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (selectedCategory) {
        try {
          const category = categories.find(cat => cat.name === selectedCategory);
          if (category) {
            const data = await getSubcategoriesByCategoryId(category.id!);
            setSubcategories(data);
          } else {
            setSubcategories([]);
          }
        } catch (error) {
          console.error("Error fetching subcategories:", error);
          setSubcategories([]);
        }
      } else {
        setSubcategories([]);
      }
    };
    fetchSubcategories();
  }, [selectedCategory, categories]);

  const addImage = () => {
    if (newImageUrl.trim() && !imageUrls.includes(newImageUrl.trim())) {
      const updatedImages = [...imageUrls, newImageUrl.trim()];
      setImageUrls(updatedImages);
      form.setValue("images", updatedImages);
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedImages);
    form.setValue("images", updatedImages);
  };

  const addSpec = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      const updatedSpecs = {
        ...specs,
        [newSpecKey.trim()]: newSpecValue.trim(),
      };
      setSpecs(updatedSpecs);
      form.setValue("specs", updatedSpecs);
      setNewSpecKey("");
      setNewSpecValue("");
    }
  };

  const removeSpec = (key: string) => {
    const updatedSpecs = { ...specs };
    delete updatedSpecs[key];
    setSpecs(updatedSpecs);
    form.setValue("specs", updatedSpecs);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const url = await uploadImageToCloudinary(file);
        uploadedUrls.push(url);
      }

      // Merge uploaded URLs with any manual URLs
      const allImageUrls = [...imageUrls, ...uploadedUrls];

      // Add product to Firebase
      await addProduct({
        name: data.name.trim(),
        description: data.description?.trim() || "",
        price: data.price,
        category: data.category || "",
        subcategory: data.subcategory || "",
        brand: data.brand?.trim() || "",
        stock: data.stock || 0,
        stockStatus: data.stockStatus,
        images: allImageUrls,
        specs: specs,
      });

      toast.success("Product added successfully!");
      setSubmitStatus("success");
      form.reset();
      setImageUrls([]);
      setSpecs({});

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Reset status after a delay
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Error adding product:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add product. Please try again.");
      }
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitButtonContent = () => {
    if (isSubmitting) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      );
    }

    if (submitStatus === "success") {
      return (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Added Successfully!
        </>
      );
    }

    if (submitStatus === "error") {
      return (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Try Again
        </>
      );
    }

    return (
      <>
        <Plus className="mr-2 h-4 w-4" />
        Add Product
      </>
    );
  };

  const getSubmitButtonVariant = () => {
    if (submitStatus === "success") return "default";
    if (submitStatus === "error") return "destructive";
    return "default";
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "internship"); // replace with your preset

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Upload failed");

    return data.secure_url; // the uploaded image URL
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsSubmitting(true);
      const uploadedUrl = await uploadImageToCloudinary(file);
      setImageUrls((prev) => {
        const updated = [...prev, uploadedUrl];
        form.setValue("images", updated);
        return updated;
      });
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!selectedFiles.includes(file)) {
      setSelectedFiles((prev) => [...prev, file]);
    }
  };

  return (
    <SheetContent>
      <ScrollArea className="h-screen">
        <SheetHeader>
          <SheetTitle className="mb-4">Add Product</SheetTitle>
          <SheetDescription asChild>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter product name"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the name of the product (max 100 characters).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter product description"
                            rows={3}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of the product
                          (optional).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            placeholder="0.00"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the price of the product.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Category and Brand */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Category & Brand</h3>

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset subcategory when category changes
                            form.setValue("subcategory", "");
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.name}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the category this product belongs to.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedCategory || subcategories.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={!selectedCategory ? "Select a category first" : subcategories.length === 0 ? "No subcategories available" : "Select a subcategory"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subcategories.map((subcategory) => (
                              <SelectItem
                                key={subcategory.id}
                                value={subcategory.name}
                              >
                                {subcategory.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select a subcategory for more specific organization (optional).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter brand name"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the brand of the product (optional).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Stock Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Stock Management</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              placeholder="0"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the current stock quantity.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stockStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select stock status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="in-stock">In Stock</SelectItem>
                              <SelectItem value="sur-commande">
                                Sur Commande
                              </SelectItem>
                              <SelectItem value="out-of-stock">
                                Out of Stock
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the current stock status of the product.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Product Images</h3>

                  {/* Upload Zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) await handleImageUpload(file);
                    }}
                    className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary transition"
                  >
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="fileUpload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary transition"
                    >
                      <label
                        htmlFor="fileUpload"
                        className="cursor-pointer text-muted-foreground"
                      >
                        Drag & drop or{" "}
                        <span className="text-primary underline">
                          click to select
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Add by URL */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter image URL"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      onClick={addImage}
                      disabled={isSubmitting || !newImageUrl.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Preview Grid */}
                  {(imageUrls.length > 0 || selectedFiles.length > 0) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {[
                        ...imageUrls,
                        ...selectedFiles.map((f) => URL.createObjectURL(f)),
                      ].map((src, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={src}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg shadow-md group-hover:opacity-90 transition"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              // Remove either from imageUrls or selectedFiles
                              if (index < imageUrls.length) {
                                removeImage(index);
                              } else {
                                setSelectedFiles((prev) =>
                                  prev.filter(
                                    (_, i) => i !== index - imageUrls.length
                                  )
                                );
                              }
                            }}
                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Specifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Specifications</h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Specification name"
                        value={newSpecKey}
                        onChange={(e) => setNewSpecKey(e.target.value)}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Specification value"
                        value={newSpecValue}
                        onChange={(e) => setNewSpecValue(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={addSpec}
                      disabled={
                        isSubmitting ||
                        !newSpecKey.trim() ||
                        !newSpecValue.trim()
                      }
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Spec
                    </Button>

                    {Object.keys(specs).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Added Specifications:
                        </p>
                        {Object.entries(specs).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                          >
                            <span className="text-sm font-medium">{key}:</span>
                            <span className="text-sm text-muted-foreground">
                              {value}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSpec(key)}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant={getSubmitButtonVariant()}
                    className="flex-1"
                  >
                    {getSubmitButtonContent()}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => {
                      form.reset();
                      setImageUrls([]);
                      setSpecs({});
                      setSubmitStatus("idle");
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </Form>
          </SheetDescription>
        </SheetHeader>
      </ScrollArea>
    </SheetContent>
  );
};

export default AddProduct;
