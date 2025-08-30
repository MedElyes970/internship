import ProductList from "@/components/ProductList";
import Image from "next/image";

const Homepage = async ({
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
      <div className="relative aspect-[3/1] mb-12">
        <Image src="/banner.png" alt="Featured Product" fill />
      </div>
      <ProductList
        category={category}
        subcategory={subcategory}
        params="homepage"
        sort={sort}
        page={currentPage}
        productsPerPage={12}
      />
    </div>
  );
};

export default Homepage;
