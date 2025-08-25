import { db } from "./firebase";
import { collection, doc, getDoc, getDocs, orderBy, query, where, limit as fsLimit } from "firebase/firestore";
import { ProductType, ProductsType } from "@/types";
import { fetchCategoriesWithSubcategories } from "./categories";

const PRODUCTS_COLLECTION = "products";

export type FetchProductsOptions = {
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  sort?: "newest" | "oldest" | "asc" | "desc";
  limitCount?: number;
};

const mapDocToProduct = (snap: any): ProductType => {
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name ?? "",
    shortDescription: data.shortDescription ?? "",
    description: data.description ?? "",
    price: typeof data.price === "number" ? data.price : Number(data.price ?? 0),
    images: data.images ?? {},
    salesCount: typeof data.salesCount === "number" ? data.salesCount : 0,
  };
};

// Convert slug to actual category name
const getCategoryNameFromSlug = async (categorySlug: string): Promise<string | null> => {
  try {
    const categories = await fetchCategoriesWithSubcategories();
    const category = categories.find(cat => cat.slug === categorySlug);
    return category ? category.name : null;
  } catch (error) {
    console.error("Error fetching categories for slug conversion:", error);
    return null;
  }
};

// Convert slug to actual subcategory name
const getSubcategoryNameFromSlug = async (subcategorySlug: string, categorySlug: string): Promise<string | null> => {
  try {
    const categories = await fetchCategoriesWithSubcategories();
    const category = categories.find(cat => cat.slug === categorySlug);
    if (!category) return null;
    
    const subcategory = category.subcategories.find(sub => sub.slug === subcategorySlug);
    return subcategory ? subcategory.name : null;
  } catch (error) {
    console.error("Error fetching subcategories for slug conversion:", error);
    return null;
  }
};

export const fetchProducts = async (options: FetchProductsOptions = {}): Promise<ProductsType> => {
  const { categorySlug, subcategorySlug, sort } = options;

  const colRef = collection(db, PRODUCTS_COLLECTION);
  const constraints: any[] = [];

  // Convert category slug to actual category name
  if (categorySlug && categorySlug !== "all") {
    const categoryName = await getCategoryNameFromSlug(categorySlug);
    if (categoryName) {
      constraints.push(where("category", "==", categoryName));
    }
  }

  // Convert subcategory slug to actual subcategory name
  if (subcategorySlug && categorySlug) {
    const subcategoryName = await getSubcategoryNameFromSlug(subcategorySlug, categorySlug);
    if (subcategoryName) {
      constraints.push(where("subcategory", "==", subcategoryName));
    }
  }

  if (sort === "newest") constraints.push(orderBy("createdAt", "desc"));
  else if (sort === "oldest") constraints.push(orderBy("createdAt", "asc"));
  else if (sort === "asc") constraints.push(orderBy("price", "asc"));
  else if (sort === "desc") constraints.push(orderBy("price", "desc"));

  const q = constraints.length ? query(colRef, ...constraints) : query(colRef);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToProduct);
};

export const fetchProductById = async (id: string): Promise<ProductType | null> => {
  const ref = doc(db, PRODUCTS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapDocToProduct(snap);
};

export const fetchDistinctProductCategories = async (max: number = 200): Promise<string[]> => {
  // Note: Firestore has no DISTINCT, so we fetch up to `max` docs and derive categories client-side.
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const q = query(colRef, fsLimit(max));
  const snapshot = await getDocs(q);
  const set = new Set<string>();
  snapshot.forEach((d) => {
    const cat = (d.data() as any)?.category;
    if (typeof cat === "string" && cat.trim().length > 0) set.add(cat);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};


