"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchCategoriesWithSubcategories, CategoryWithSubcategories } from "@/lib/categories";
import { fetchDistinctProductCategories } from "@/lib/products";
import { ChevronDown, ChevronRight } from "lucide-react";

type UiCategory = { name: string; slug: string };
type UiSubcategory = { name: string; slug: string; categorySlug: string };

const Categories = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const selectedCategory = searchParams.get("category");
  const selectedSubcategory = searchParams.get("subcategory");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchCategoriesWithSubcategories();
        if (data.length === 0) {
          // Fallback: derive from products if no categories in DB
          const derived = await fetchDistinctProductCategories();
          const fallbackCategories: CategoryWithSubcategories[] = derived.map(slug => ({
            id: slug,
            name: slug,
            slug: slug,
            subcategories: []
          }));
          if (mounted) setCategories(fallbackCategories);
        } else {
          if (mounted) setCategories(data);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCategoryChange = (categorySlug: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (categorySlug && categorySlug !== "all") {
      params.set("category", categorySlug);
      // Clear subcategory when changing category
      params.delete("subcategory");
    } else {
      params.delete("category");
      params.delete("subcategory");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSubcategoryChange = (subcategorySlug: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (subcategorySlug) {
      params.set("subcategory", subcategorySlug);
    } else {
      params.delete("subcategory");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleCategoryExpansion = (categorySlug: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categorySlug)) {
      newExpanded.delete(categorySlug);
    } else {
      newExpanded.add(categorySlug);
    }
    setExpandedCategories(newExpanded);
  };

  const isCategorySelected = (categorySlug: string) => {
    return (selectedCategory ?? "all") === categorySlug;
  };

  const isSubcategorySelected = (subcategorySlug: string) => {
    return selectedSubcategory === subcategorySlug;
  };

  if (loading) {
    return (
      <div className="bg-gray-100 p-2 rounded-lg mb-4">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-4">
      {/* All Categories Option */}
      <div
        className={`flex items-center justify-center gap-2 cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isCategorySelected("all") 
            ? "bg-blue-500 text-white" 
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => handleCategoryChange("all")}
      >
        All Categories
      </div>

      {/* Categories with Subcategories */}
      {categories.map((category) => (
        <div key={category.slug} className="space-y-1">
          {/* Category */}
          <div
            className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isCategorySelected(category.slug)
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => handleCategoryChange(category.slug)}
          >
            <span>{category.name}</span>
            {category.subcategories.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategoryExpansion(category.slug);
                }}
                className="p-1 hover:bg-white/20 rounded"
              >
                {expandedCategories.has(category.slug) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Subcategories */}
          {category.subcategories.length > 0 && expandedCategories.has(category.slug) && (
            <div className="ml-4 space-y-1">
              {category.subcategories.map((subcategory) => (
                <div
                  key={subcategory.slug}
                  className={`flex items-center cursor-pointer px-3 py-2 rounded-lg text-sm transition-colors ${
                    isSubcategorySelected(subcategory.slug)
                      ? "bg-green-500 text-white"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  onClick={() => handleSubcategoryChange(subcategory.slug)}
                >
                  <span className="ml-2">{subcategory.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Categories;
