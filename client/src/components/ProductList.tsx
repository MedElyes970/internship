import Categories from "./Categories";
import ProductCard from "./ProductCard";
import Link from "next/link";
import Filter from "./Filter";
import { fetchProducts } from "@/lib/products";
import { Suspense } from "react";

const ProductsGrid = async ({ category, sort }: { category: string; sort: string | null }) => {
  const data = await fetchProducts({ categorySlug: category, sort: (sort as any) ?? undefined });
  if (!data.length) {
    return <div className="text-sm text-gray-500">No products found.</div>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-12">
      {data.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

const ProductList = async ({ category, params, sort }: { category: string; params: "homepage" | "products"; sort: string | null }) => {

  return (
    <div className="w-full">
      <Categories />
      {params === "products" && <Filter />}
      <Suspense fallback={<div className="text-sm text-gray-500">Loading products...</div>}>
        {/* @ts-expect-error Async Server Component */}
        <ProductsGrid category={category} sort={sort} />
      </Suspense>
      <Link
        href={category ? `/products/?category=${category}` : "/products"}
        className="flex justify-end mt-4 underline text-sm text-gray-500"
      >
        View all products
      </Link>
    </div>
  );
};

export default ProductList;
