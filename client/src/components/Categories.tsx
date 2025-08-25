"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchCategories } from "@/lib/categories";
import { fetchDistinctProductCategories } from "@/lib/products";

type UiCategory = { name: string; slug: string };

const Categories = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [categories, setCategories] = useState<UiCategory[]>([{ name: "All", slug: "all" }]);
  const [loading, setLoading] = useState(true);

  const selectedCategory = searchParams.get("category");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchCategories();
        let ui: UiCategory[] = data.map(c => ({ name: c.name, slug: c.slug }))
        if (ui.length === 0) {
          // Fallback: derive from products if no categories in DB
          const derived = await fetchDistinctProductCategories();
          ui = derived.map(slug => ({ name: slug, slug }));
        }
        if (mounted) setCategories([{ name: "All", slug: "all" }, ...ui]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (value: string | null) => {
    const params = new URLSearchParams(searchParams);
    params.set("category", value || "all");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 bg-gray-100 p-2 rounded-lg mb-4 text-sm">
      {(loading ? categories : categories).map((category) => (
        <div
          className={`flex items-center justify-center gap-2 cursor-pointer px-2 py-1 rounded-md ${
            (selectedCategory ?? "all") === category.slug ? "bg-white" : "text-gray-500"
          }`}
          key={category.slug}
          onClick={() => handleChange(category.slug)}
        >
          {category.name}
        </div>
      ))}
    </div>
  );
};

export default Categories;
