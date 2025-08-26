"use client";

import ShippingForm from "@/components/ShippingForm";
import ConfirmationStep from "@/components/ConfirmationStep";
import useCartStore from "@/stores/cartStore";
import { ShippingFormInputs } from "@/types";
import { ArrowRight, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const steps = [
  { id: 1, title: "Shopping Cart" },
  { id: 2, title: "Shipping Address" },
  { id: 3, title: "Confirm Details" },
];

const CartPage = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [shippingForm, setShippingForm] = useState<ShippingFormInputs | null>(
    null
  );
  const { cart, removeFromCart, clearCart } = useCartStore();
  const activeStep = parseInt(searchParams.get("step") || "1");

  const isCartEmpty = cart.length === 0;

  const handleConfirmOrder = async () => {
    console.log("handleConfirmOrder called");
    if (!user || !shippingForm || cart.length === 0) {
      console.log("Early return - missing data:", { user: !!user, shippingForm: !!shippingForm, cartLength: cart.length });
      return;
    }

    try {
      console.log("Creating order...");
      
      // Get the next order number
      const counterRef = doc(db, "counters", "orders");
      const counterDoc = await getDoc(counterRef);
      
      let orderNumber = 1;
      if (counterDoc.exists()) {
        orderNumber = counterDoc.data().current + 1;
      }
      
      // Update the counter
      await updateDoc(counterRef, { current: increment(1) });
      
      const orderData = {
        orderNumber: orderNumber,
        userId: user.uid,
        items: cart,
        shippingInfo: shippingForm,
        total: cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
        createdAt: serverTimestamp(),
        status: "pending",
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log("Order created with ID:", docRef.id, "Order Number:", orderNumber);

      clearCart();
      console.log("Cart cleared, redirecting to order-success");
      // Use URL parameters instead of localStorage
      router.push(`/order-success?orderId=${docRef.id}`, { scroll: false });
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  return (
    <div className="flex flex-col gap-8 items-center justify-center mt-12">
      <h1 className="text-2xl font-medium">Your Shopping Cart</h1>

      {/* STEPS */}
      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {steps.map((step) => (
          <div
            className={`flex items-center gap-2 border-b-2 pb-4 ${
              step.id === activeStep ? "border-gray-800" : "border-gray-200"
            }`}
            key={step.id}
          >
            <div
              className={`w-6 h-6 rounded-full text-white p-4 flex items-center justify-center ${
                step.id === activeStep ? "bg-gray-800" : "bg-gray-400"
              }`}
            >
              {step.id}
            </div>
            <p
              className={`text-sm font-medium ${
                step.id === activeStep ? "text-gray-800" : "text-gray-400"
              }`}
            >
              {step.title}
            </p>
          </div>
        ))}
      </div>

      {/* STEP CONTENT */}
      <div className="w-full flex flex-col gap-16">
        <div className="w-full shadow-lg border-1 border-gray-100 p-8 rounded-lg flex flex-col gap-8">
          {activeStep === 1 ? (
            isCartEmpty ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <img
                  src="/empty-cart.png"
                  alt="Empty shopping cart illustration"
                  className="object-contain"
                />
                <p className="text-sm text-gray-500 text-center">
                  Your cart is empty. Add items to continue.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {cart.map((item) => (
                  <div
                    className="flex items-center justify-between"
                    key={item.id}
                  >
                    <div className="flex gap-8">
                      <div className="relative w-32 h-32 bg-gray-50 rounded-lg overflow-hidden">
                        <Image
                          src={Object.values(item.images)[0]}
                          alt={item.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="flex flex-col justify-between">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item)}
                      className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 transition-all duration-300 text-red-400 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : activeStep === 2 ? (
            <ShippingForm setShippingForm={setShippingForm} />
          ) : activeStep === 3 && shippingForm ? (
            <ConfirmationStep
              shippingForm={shippingForm}
              cart={cart}
              onCancel={() => router.push("/", { scroll: false })}
              onBack={() => router.push("/cart?step=2", { scroll: false })}
              onConfirm={handleConfirmOrder}
            />
          ) : (
            <p className="text-sm text-gray-500">
              Please fill in the shipping form to continue.
            </p>
          )}
        </div>

        {/* SIDEBAR: ONLY SHOW ON STEP 1 */}
        {activeStep === 1 && (
          <div className="w-full shadow-lg border-1 border-gray-100 p-8 rounded-lg flex flex-col gap-8 h-max">
            <h2 className="font-semibold">Cart Details</h2>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between text-sm">
                <p className="text-gray-500">Subtotal</p>
                <p className="font-medium">
                  $
                  {cart
                    .reduce((acc, item) => acc + item.price * item.quantity, 0)
                    .toFixed(2)}
                </p>
              </div>
              <div className="flex justify-between text-sm">
                <p className="text-gray-500">Discount 10%</p>
                <p className="font-medium">$0.00</p>
              </div>
              <div className="flex justify-between text-sm">
                <p className="text-gray-500">Shipping Fee</p>
                <p className="font-medium">$0.00</p>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between">
                <p className="text-gray-800 font-semibold">Total</p>
                <p className="font-medium">
                  $
                  {cart
                    .reduce((acc, item) => acc + item.price * item.quantity, 0)
                    .toFixed(2)}
                </p>
              </div>

              <button
                onClick={() =>
                  !isCartEmpty && router.push("/cart?step=2", { scroll: false })
                }
                disabled={isCartEmpty}
                className={`w-full transition-all duration-300 text-white p-2 rounded-lg flex items-center justify-center gap-2 ${
                  isCartEmpty
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-900 cursor-pointer"
                }`}
              >
                Continue
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
