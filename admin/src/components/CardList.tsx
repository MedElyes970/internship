"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useEffect, useState } from "react";
import { getPopularProducts, Product } from "@/lib/products";

const latestTransactions = [
  {
    id: 1,
    title: "Order Payment",
    badge: "John Doe",
    image:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: 1400,
  },
  {
    id: 2,
    title: "Order Payment",
    badge: "Jane Smith",
    image:
      "https://images.pexels.com/photos/4969918/pexels-photo-4969918.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: 2100,
  },
  {
    id: 3,
    title: "Order Payment",
    badge: "Michael Johnson",
    image:
      "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: 1300,
  },
  {
    id: 4,
    title: "Order Payment",
    badge: "Lily Adams",
    image:
      "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: 2500,
  },
  {
    id: 5,
    title: "Order Payment",
    badge: "Sam Brown",
    image:
      "https://images.pexels.com/photos/1680175/pexels-photo-1680175.jpeg?auto=compress&cs=tinysrgb&w=800",
    count: 1400,
  },
];

const CardList = ({ title }: { title: string }) => {
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (title === "Popular Products") {
      const fetchPopularProducts = async () => {
        setLoading(true);
        setError(null);
        try {
          console.log('CardList: Starting to fetch popular products...');
          
          // First, let's test if we can fetch any products at all
          try {
            const { getProducts } = await import('@/lib/products');
            const allProducts = await getProducts();
            console.log('CardList: Test - Total products in DB:', allProducts.length);
            console.log('CardList: Test - Sample product:', allProducts[0]);
          } catch (testError) {
            console.error('CardList: Test - Cannot even fetch basic products:', testError);
          }
          
          const products = await getPopularProducts(5);
          console.log('CardList: Received popular products:', products);
          setPopularProducts(products);
        } catch (error) {
          console.error('CardList: Error fetching popular products:', error);
          setError(`Failed to load popular products: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setLoading(false);
        }
      };

      fetchPopularProducts();
    }
  }, [title]);

  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">{title}</h1>
      <div className="flex flex-col gap-2">
        {title === "Popular Products" ? (
          loading ? (
            // Loading skeleton while fetching data
            Array.from({ length: 5 }).map((_, index) => (
              <Card
                key={index}
                className="flex-row items-center justify-between gap-4 p-4"
              >
                <div className="w-12 h-12 rounded-sm bg-gray-200 animate-pulse"></div>
                <CardContent className="flex-1 p-0">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                </CardContent>
                <CardFooter className="p-0">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                </CardFooter>
              </Card>
            ))
          ) : popularProducts.length > 0 ? (
            popularProducts.map((item) => (
              <Card
                key={item.id}
                className="flex-row items-center justify-between gap-4 p-4"
              >
                <div className="w-12 h-12 rounded-sm relative overflow-hidden">
                  <Image
                    src={item.images && item.images.length > 0 ? item.images[0] : "/products/1g.png"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to default image if the product image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = "/products/1g.png";
                    }}
                  />
                </div>
                <CardContent className="flex-1 p-0">
                  <CardTitle className="text-sm font-medium">
                    {item.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {item.salesCount || 0} sales
                  </Badge>
                </CardContent>
                <CardFooter className="p-0">${item.price}</CardFooter>
              </Card>
            ))
          ) : error ? (
            // Error state
            <div className="text-center text-red-500 py-4">
              {error}
            </div>
          ) : (
            // No products found
            <div className="text-center text-gray-500 py-4">
              No products with sales found
            </div>
          )
        ) : (
          latestTransactions.map((item) => (
            <Card
              key={item.id}
              className="flex-row items-center justify-between gap-4 p-4"
            >
              <div className="w-12 h-12 rounded-sm relative overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="flex-1 p-0">
                <CardTitle className="text-sm font-medium">
                  {item.title}
                </CardTitle>
                <Badge variant="secondary">{item.badge}</Badge>
              </CardContent>
              <CardFooter className="p-0">${item.count /1000}K</CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CardList;
