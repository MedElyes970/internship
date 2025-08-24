import { ShippingFormInputs, shippingFormSchema } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";

const ShippingForm = ({
  setShippingForm,
}: {
  setShippingForm: (data: ShippingFormInputs) => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormInputs>({
    resolver: zodResolver(shippingFormSchema),
  });

  const router = useRouter();

  const handleShippingForm: SubmitHandler<ShippingFormInputs> = (data) => {
    setShippingForm(data);
    router.push("/cart?step=3", { scroll: false });
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(handleShippingForm)}
    >
      {/* NAME */}
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-xs text-gray-500 font-medium">
          Name
        </label>
        <input
          className="border-b border-gray-200 py-2 outline-none text-sm"
          type="text"
          id="name"
          placeholder="John Doe"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* EMAIL */}
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-xs text-gray-500 font-medium">
          Email
        </label>
        <input
          className="border-b border-gray-200 py-2 outline-none text-sm"
          type="email"
          id="email"
          placeholder="johndoe@gmail.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* PHONE */}
      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-xs text-gray-500 font-medium">
          Phone
        </label>
        <input
          className="border-b border-gray-200 py-2 outline-none text-sm"
          type="text"
          id="phone"
          placeholder="123456789"
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-xs text-red-500">{errors.phone.message}</p>
        )}
      </div>

      {/* ADDRESS */}
      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-xs text-gray-500 font-medium">
          Address
        </label>
        <input
          className="border-b border-gray-200 py-2 outline-none text-sm"
          type="text"
          id="address"
          placeholder="123 Main St"
          {...register("address")}
        />
        {errors.address && (
          <p className="text-xs text-red-500">{errors.address.message}</p>
        )}
      </div>

      {/* APARTMENT / UNIT (optional) */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="apartment"
          className="text-xs text-gray-500 font-medium"
        >
          Apartment / Unit (optional)
        </label>
        <input
          className="border-b border-gray-200 py-2 outline-none text-sm"
          type="text"
          id="apartment"
          placeholder="Apt 101"
          {...register("apartment")}
        />
      </div>

      {/* CITY */}
      <div className="flex flex-col gap-1">
        <label htmlFor="city" className="text-xs text-gray-500 font-medium">
          City
        </label>
        <input
          className="border-b border-gray-200 py-2 outline-none text-sm"
          type="text"
          id="city"
          placeholder="New York"
          {...register("city")}
        />
        {errors.city && (
          <p className="text-xs text-red-500">{errors.city.message}</p>
        )}
      </div>

      {/* STATE */}
      <div className="flex flex-col gap-1">
        <label htmlFor="state" className="text-xs text-gray-500 font-medium">
          State / Province
        </label>
        <input
          className="border-b border-gray-200 py-2 outline-none text-sm"
          type="text"
          id="state"
          placeholder="NY"
          {...register("state")}
        />
        {errors.state && (
          <p className="text-xs text-red-500">{errors.state.message}</p>
        )}
      </div>

      {/* ZIP */}
      <div className="flex flex-col gap-1">
        <label htmlFor="zip" className="text-xs text-gray-500 font-medium">
          ZIP / Postal Code
        </label>
        <input
          className="border-b border-gray-200 py-2 outline-none text-sm"
          type="text"
          id="zip"
          placeholder="10001"
          {...register("zip")}
        />
        {errors.zip && (
          <p className="text-xs text-red-500">{errors.zip.message}</p>
        )}
      </div>

      {/* COUNTRY */}
      <div className="flex flex-col gap-1">
        <label htmlFor="country" className="text-xs text-gray-500 font-medium">
          Country
        </label>
        <input
          className="border-b border-gray-200 py-2 outline-none text-sm"
          type="text"
          id="country"
          placeholder="USA"
          {...register("country")}
        />
        {errors.country && (
          <p className="text-xs text-red-500">{errors.country.message}</p>
        )}
      </div>

      {/* BUTTONS */}
      <div className="flex gap-4 mt-4">
        <button
          type="button"
          onClick={() => router.push("/cart?step=1", { scroll: false })}
          className="flex-1 bg-gray-200 hover:bg-gray-300 transition-all duration-300 text-gray-800 p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </button>

        <button
          type="submit"
          className="flex-1 bg-gray-800 hover:bg-gray-900 transition-all duration-300 text-white p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </form>
  );
};

export default ShippingForm;
