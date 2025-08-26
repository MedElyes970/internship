"use client";

import { CartItemsType, ShippingFormInputs } from "@/types";

type Props = {
  shippingForm: ShippingFormInputs;
  cart: CartItemsType;
  onCancel: () => void;
  onBack: () => void;
  onConfirm: (shippingForm: ShippingFormInputs) => void;
};

const ConfirmationStep = ({
  shippingForm,
  cart,
  onCancel,
  onBack,
  onConfirm,
}: Props) => {
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <h2 className="text-xl font-semibold">Confirm Your Details</h2>

      {/* Shipping Information */}
      <div className="shadow-lg border rounded-lg p-6 flex flex-col gap-2">
        <h3 className="font-medium text-gray-700">Shipping Info</h3>
        <p>{shippingForm.name}</p>
        <p>{shippingForm.email}</p>
        <p>{shippingForm.phone}</p>
        <p>
          {shippingForm.address} {shippingForm.apartment || ""}
        </p>
        <p>
          {shippingForm.city}, {shippingForm.state} {shippingForm.zip},{" "}
          {shippingForm.country}
        </p>
      </div>

      {/* Cart Items */}
      <div className="shadow-lg border rounded-lg p-6 flex flex-col gap-2">
        <h3 className="font-medium text-gray-700">Cart Items</h3>
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <p>
              {item.name} x {item.quantity}
            </p>
            <p>${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}

        {/* Total */}
        <hr className="border-gray-200 my-2" />
        <div className="flex justify-between font-semibold">
          <p>Total</p>
          <p>${total.toFixed(2)}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-4">
        <button
          onClick={onCancel}
          className="flex-1 bg-red-100 hover:bg-red-200 text-red-500 p-2 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-lg transition"
        >
          Back
        </button>
        <button
          onClick={() => onConfirm(shippingForm)}
          className="flex-1 bg-gray-800 hover:bg-gray-900 text-white p-2 rounded-lg transition"
        >
          Confirm Order
        </button>
      </div>
    </div>
  );
};

export default ConfirmationStep;
