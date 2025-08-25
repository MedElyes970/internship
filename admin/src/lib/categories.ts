import { db } from "./firebase";
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
} from "firebase/firestore";

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "categories";

// Add a new category
export const addCategory = async (
  categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">
) => {
  try {
    // Validate input
    if (!categoryData.name || !categoryData.slug) {
      throw new Error("Name and slug are required");
    }

    if (categoryData.name.length > 50) {
      throw new Error("Category name must be less than 50 characters");
    }

    if (categoryData.slug.length > 50) {
      throw new Error("Category slug must be less than 50 characters");
    }

    // Check if slug already exists
    const isUnique = await isSlugUnique(categoryData.slug);
    if (!isUnique) {
      throw new Error("A category with this slug already exists");
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...categoryData,
    };
  } catch (error) {
    console.error("Error adding category:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add category");
  }
};

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  } catch (error) {
    console.error("Error getting categories:", error);
    throw new Error("Failed to get categories");
  }
};

// Update a category
export const updateCategory = async (
  id: string,
  updates: Partial<Category>
) => {
  try {
    if (!id) {
      throw new Error("Category ID is required");
    }

    const categoryRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(categoryRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return { id, ...updates };
  } catch (error) {
    console.error("Error updating category:", error);
    throw new Error("Failed to update category");
  }
};

// Delete a category
export const deleteCategory = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Category ID is required");
    }

    const categoryRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(categoryRef);
    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error("Failed to delete category");
  }
};

// Generate slug from name
export const generateSlug = (name: string): string => {
  if (!name) return "";

  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
};

// Check if slug already exists
export const isSlugUnique = async (
  slug: string,
  excludeId?: string
): Promise<boolean> => {
  const q = query(collection(db, COLLECTION_NAME), where("slug", "==", slug));
  const snapshot = await getDocs(q);
  if (excludeId) {
    return !snapshot.docs.some((doc) => doc.id !== excludeId);
  }
  return snapshot.empty;
};

// Get category by slug
export const getCategoryBySlug = async (
  slug: string
): Promise<Category | null> => {
  try {
    if (!slug) return null;

    const categories = await getCategories();
    return categories.find((cat) => cat.slug === slug) || null;
  } catch (error) {
    console.error("Error getting category by slug:", error);
    return null;
  }
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    if (!id) return null;

    const categories = await getCategories();
    return categories.find((cat) => cat.id === id) || null;
  } catch (error) {
    console.error("Error getting category by ID:", error);
    return null;
  }
};
