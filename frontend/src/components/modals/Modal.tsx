import React, { useState } from "react";
import { ClipLoader } from "react-spinners";
import useBuyLand from "../../hooks/useBuyLand.ts";

interface ModalProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  land: {
    listingId: number;
  };
}

const Modal = ({ setIsOpen, land }: ModalProps) => {
  console.log("land", land);
  const [isLoading, setIsLoading] = useState(false);
  const handleBuyLand = useBuyLand();

  const handle_modal_close = () => {
    setIsOpen((prev: boolean) => !prev);
  };

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      await handleBuyLand(land.listingId);

      // toast.success("Transaction successful! 🎉");
      setIsOpen(false);
    } catch (error) {
      console.error("Transaction failed:", error);
      // toast.error("Transaction failed. Please try again! ❌");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="fixed flex justify-center items-center left-0 right-0 top-0 bottom-0 bg-opacity-70 bg-gray-500 inset-0">
      <div className="h-[400px] w-[400px] flex justify-center items-center flex-col bg-[#e5dfdd] rounded-xl shadow-lg">
        <p className="font-serif text-2xl text-center">
          Are you sure you want to continue with this transaction?
        </p>

        <div className="mt-10 w-[50%] flex flex-row justify-between items-center">
          <button
            onClick={handle_modal_close}
            className="border border-black bg-gradient-to-r from-[#ece2dd] via-[#ce9f89] to-[#aca4a0] text-black font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out p-2 rounded-lg"
            disabled={isLoading}
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className="border border-black bg-gradient-to-r from-[#ece2dd] via-[#ce9f89] to-[#aca4a0] text-black font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out p-2 rounded-lg ml-4 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? <ClipLoader size={20} color="#000" /> : "Confirm"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Modal;
