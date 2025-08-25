import { db } from "./firebase";
import { collection, doc, getDoc, getDocs, orderBy, query, where, limit as fsLimit } from "firebase/firestore";
import { ProductType, ProductsType } from "@/types";

const PRODUCTS_COLLECTION = "products";

export type FetchProductsOptions = {
  categorySlug?: string | null;
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

export const fetchProducts = async (options: FetchProductsOptions = {}): Promise<ProductsType> => {
  const { categorySlug, sort } = options;

  const colRef = collection(db, PRODUCTS_COLLECTION);
  const constraints: any[] = [];

  if (categorySlug && categorySlug !== "all") {
    constraints.push(where("category", "==", categorySlug));
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


