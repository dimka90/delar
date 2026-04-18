import React, { useState } from "react";
import Modal from "./modals/Modal.tsx";

interface ApplyButtonWithModalProps {
  buttonText?: string;
}

interface Land {
  listingId: number;
}

const ApplyButtonWithModal: React.FC<
  ApplyButtonWithModalProps & { land: Land }
> = ({ buttonText = "Apply To Buy Land", land }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleModalToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div>
      <button
        onClick={handleModalToggle}
        className="bg-primary hover:bg-primary-hover cursor-pointer text-white px-6 py-2 rounded"
      >
        {buttonText}
      </button>

      {isOpen && <Modal setIsOpen={setIsOpen} land={land} />}
    </div>
  );
};

export default ApplyButtonWithModal;
