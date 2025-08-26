import ProductInteraction from "@/components/ProductInteraction";
import Image from "next/image";
import { fetchProductById } from "@/lib/products";
import ProductGallery from "@/components/ProductGallery";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const product = await fetchProductById(id);
  return {
    title: product?.name || "Product",
    describe: product?.description || "",
  };
};

const ProductPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const product = await fetchProductById(id);
  if (!product) {
    return <div className="mt-12 text-sm text-gray-500">Product not found.</div>;
  }
  // Get the first available image
  return (
    <div className="flex flex-col gap-4 lg:flex-row md:gap-12 mt-12">
      {/* IMAGE */}
      <div className="w-full lg:w-5/12">
        <ProductGallery images={product.images} />
      </div>
      {/* DETAILS */}
      <div className="w-full lg:w-7/12 flex flex-col gap-4">
        <h1 className="text-2xl font-medium">{product.name}</h1>
        <p className="text-gray-500">{product.description}</p>
        <h2 className="text-2xl font-semibold">${product.price.toFixed(2)}</h2>
        <ProductInteraction
          product={product}
        />

      </div>
    </div>
  );
};

export default ProductPage;
