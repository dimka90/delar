import React, { useState } from "react";
import useListLand from "../../hooks/useListLand.ts";

interface ModalProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  land: {
    landIndex: number;
    isListed: boolean;
    listingId?: number | null;
    listingPricePerPlot?: string | null;
  };
  title: string;
  body: string;
}

const Modal = ({ setIsOpen, land, title, body }: ModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [listingPricePerPlot, setListingPricePerPlot] = useState(land.listingPricePerPlot ?? "");
  const handleListLand = useListLand();

  const handle_modal_close = () => {
    setIsOpen((prev: boolean) => !prev);
  };

  const handleConfirm = async () => {
    setIsLoading(true);

    try {
      await handleListLand({
        landIndex: land.landIndex,
        listingId: land.listingId,
        isListed: land.isListed,
        listingPricePerPlot,
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Transaction failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="fixed flex justify-center items-center left-0 right-0 top-0 bottom-0 bg-opacity-70 bg-gray-900 inset-0 w-full h-full">
      <div className="bg-white p-6 rounded-lg max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{body}</p>
        </div>

        {!land.isListed && (
          <div className="mb-6">
            <label htmlFor="listingPricePerPlot" className="block text-sm font-medium text-gray-700 mb-2">
              Listing Price Per Plot
            </label>
            <input
              id="listingPricePerPlot"
              type="number"
              min="0"
              step="0.0001"
              value={listingPricePerPlot}
              onChange={(e) => setListingPricePerPlot(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter listing price in USDT"
            />
          </div>
        )}

        <div className="flex flex-col space-y-2 mt-6">
          <div className="flex space-x-4 justify-end">
            <button
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              onClick={handle_modal_close}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Modal;
