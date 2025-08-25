import ProductList from "@/components/ProductList";

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category: string; sort: string | null }>;
}) => {
  const { category, sort } = await searchParams;
  return (
    <div className="">
      <ProductList category={category} params="products" sort={sort} />
    </div>
  );
};

export default ProductsPage;
