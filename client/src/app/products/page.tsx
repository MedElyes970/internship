import ProductList from "@/components/ProductList";

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category: string; subcategory: string | null; sort: string | null }>;
}) => {
  const { category, subcategory, sort } = await searchParams;
  return (
    <div className="">
      <ProductList category={category} subcategory={subcategory} params="products" sort={sort} />
    </div>
  );
};

export default ProductsPage;
