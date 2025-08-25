"use client";

import useCartStore from "@/stores/cartStore";
import { ProductType } from "@/types";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";

const ProductCard = ({ product }: { product: ProductType }) => {
  const { addToCart } = useCartStore();

  const handleAddToCart = () => {
    addToCart({
      ...product,
      quantity: 1,
    });
    toast.success("Product added to cart")
  };

  const images = useMemo(() => Object.values(product.images) as string[], [product.images]);
  const primary = images[0];
  const secondary = images[1] || images[0];
  const [hovered, setHovered] = useState(false);

  return (
    <div className="shadow-lg rounded-lg overflow-hidden">
      {/* IMAGE */}
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-[2/3]" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          {/* Base image */}
          <Image
            src={primary}
            alt={product.name}
            fill
            priority
            className={`object-cover transition-opacity duration-300 ${hovered ? "opacity-0" : "opacity-100"}`}
          />
          {/* Hover image crossfade */}
          <Image
            src={secondary}
            alt={product.name}
            fill
            className={`object-cover transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      </Link>
      {/* PRODUCT DETAIL */}
      <div className="flex flex-col gap-4 p-4">
        <h1 className="font-medium">{product.name}</h1>
        <p className="text-sm text-gray-500">{product.shortDescription}</p>
        {/* PRICE AND ADD TO CART BUTTON */}
        <div className="flex items-center justify-between">
          <p className="font-medium">${product.price.toFixed(2)}</p>
          <button
            onClick={handleAddToCart}
            className="ring-1 ring-gray-200 shadow-lg rounded-md px-2 py-1 text-sm cursor-pointer hover:text-white hover:bg-black transition-all duration-300 flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
