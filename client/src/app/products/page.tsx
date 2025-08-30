import ProductList from "@/components/ProductList";

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ 
    category: string | null; 
    subcategory: string | null; 
    sort: string | null;
    page: string | null;
  }>;
}) => {
  const { category, subcategory, sort, page } = await searchParams;
  const currentPage = page ? parseInt(page) : 1;
  
  return (
    <div className="">
      <ProductList 
        category={category} 
        subcategory={subcategory} 
        params="products" 
        sort={sort}
        page={currentPage}
        productsPerPage={12}
      />
    </div>
  );
};

export default ProductsPage;
