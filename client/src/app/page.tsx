import ProductList from "@/components/ProductList";
import Image from "next/image";

const Homepage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category: string | null; subcategory: string | null; sort: string | null }>;
}) => {
  const { category, subcategory, sort } = await searchParams;
  return (
    <div className="">
      <div className="relative aspect-[3/1] mb-12">
        <Image src="/featured.png" alt="Featured Product" fill />
      </div>
      <ProductList category={category} subcategory={subcategory} params="homepage" sort={sort} />
    </div>
  );
};

export default Homepage;
