import React, { useState } from "react";
import Modal from "./modals/ListLandModal.tsx";

interface LeaseLandButtonProps {
  buttonText?: string;
}

interface Land {
  landIndex: number;
  isListed: boolean;
  listingId?: number | null;
  isVerified: boolean;
  listingPricePerPlot?: string | null;
}

const ListLandButton: React.FC<
  LeaseLandButtonProps & { land: Land; isDisabled?: boolean }
> = ({ buttonText = "List Land", land, isDisabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const modalTitle: string = land.isListed ? "Remove Land From Listing" : "List Land For Sale";
  const modalBody: string = land.isListed
    ? "Are you sure you want to remove this land from active listings?"
    : "Enter the listing price per plot to publish this verified land on the marketplace.";
  const handleModalToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div>
      <button
        onClick={handleModalToggle}
        className="bg-primary hover:bg-primary cursor-pointer text-white px-6 py-2 rounded"
        disabled={isDisabled || !land.isVerified}
      >
        {buttonText}
      </button>

      {isOpen && <Modal setIsOpen={setIsOpen} land={land} title={modalTitle} body={modalBody} />}
    </div>
  );
};

export default ListLandButton;
