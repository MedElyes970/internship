import ProductList from "@/components/ProductList";
import Image from "next/image";

const Homepage = async ({
  searchParams,
}: {
  searchParams: Promise<{ category: string; sort: string | null }>;
}) => {
  const { category, sort } = await searchParams;
  return (
    <div className="">
      <div className="relative aspect-[3/1] mb-12">
        <Image src="/featured.png" alt="Featured Product" fill />
      </div>
      <ProductList category={category} params="homepage" sort={sort} />
    </div>
  );
};

export default Homepage;
