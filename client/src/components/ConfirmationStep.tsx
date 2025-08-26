"use client";

import { ShippingFormInputs, CartItemsType } from "@/types";
import Image from "next/image";
import { ArrowLeft, Check, X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  shippingForm: ShippingFormInputs;
  cart: CartItemsType;
  onCancel: () => void;
  onBack: () => void;
  onConfirm: () => void;
};

const ConfirmationStep = ({
  shippingForm,
  cart,
  onCancel,
  onBack,
  onConfirm,
}: Props) => {
  const [hasStockIssues, setHasStockIssues] = useState(false);

  useEffect(() => {
    // Check for stock issues
    const stockIssues = cart.filter(item => {
      if (item.stock !== undefined && item.quantity > item.stock) {
        return true;
      }
      return false;
    });
    setHasStockIssues(stockIssues.length > 0);
  }, [cart]);

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleConfirm = () => {
    if (hasStockIssues) {
      alert("Some items in your cart have insufficient stock. Please return to cart and resolve these issues.");
      return;
    }
    onConfirm();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Stock Warning */}
      {hasStockIssues && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <p className="text-red-800 font-medium text-sm">Stock Issues Detected</p>
          </div>
          <p className="text-red-700 text-sm mt-2">
            Some items in your cart have insufficient stock. Please return to cart and resolve these issues.
          </p>
        </div>
      )}
      
      {/* SHIPPING INFO */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">Shipping Information</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>
            <span className="font-medium">Name:</span> {shippingForm.name}
          </p>
          <p>
            <span className="font-medium">Email:</span> {shippingForm.email}
          </p>
          <p>
            <span className="font-medium">Phone:</span> {shippingForm.phone}
          </p>
          <p>
            <span className="font-medium">Address:</span> {shippingForm.address}
            {shippingForm.apartment ? `, ${shippingForm.apartment}` : ""},{" "}
            {shippingForm.city}, {shippingForm.state} {shippingForm.zip},{" "}
            {shippingForm.country}
          </p>
        </div>
      </div>

      {/* ORDER SUMMARY */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Order Summary</h3>
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden">
                  <Image
                    src={Object.values(item.images)[0]}
                    alt={item.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-gray-500">
                    Qty: {item.quantity} · ${item.price.toFixed(2)} each
                  </span>
                </div>
              </div>
              <span className="text-sm font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <hr className="border-gray-200" />
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Discount</span>
          <span className="font-medium">$0.00</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Shipping Fee</span>
          <span className="font-medium">$0.00</span>
        </div>
        <hr className="border-gray-200" />
        <div className="flex justify-between">
          <span className="text-gray-800 font-semibold">Total</span>
          <span className="font-semibold">${subtotal.toFixed(2)}</span>
        </div>
      </div>

      {/* BUTTONS: Cancel, Back, Confirm */}
      <div className="flex gap-4 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-red-200 hover:bg-red-300 transition-all duration-300 text-red-700 p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>

        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-200 hover:bg-gray-300 transition-all duration-300 text-gray-800 p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={hasStockIssues}
          className={`flex-1 transition-all duration-300 p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2 ${
            hasStockIssues
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-gray-800 hover:bg-gray-900 text-white"
          }`}
        >
          <Check className="w-3 h-3" />
          {hasStockIssues ? "Resolve Stock Issues" : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationStep;
