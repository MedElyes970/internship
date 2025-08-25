import { db } from "./firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export type Category = {
  id: string;
  name: string;
  slug: string;
  position?: number;
};

const CATEGORIES_COLLECTION = "categories";

export const fetchCategories = async (): Promise<Category[]> => {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  const q = query(colRef, orderBy("position", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      name: data.name ?? "",
      slug: data.slug ?? "",
      position: typeof data.position === "number" ? data.position : undefined,
    };
  });
};


