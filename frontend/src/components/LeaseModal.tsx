import React from "react";

interface ModalProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Modal = ({ setIsOpen }: ModalProps) => {
  const handle_modal_close = () => {
    setIsOpen((prev: boolean) => !prev);
  };
  return (
    <section className="fixed flex justify-center items-center left-0 right-0 top-0 bottom-0 bg-opacity-70 bg-gray-500 inset-0">
      <div className=" h-[400px] w-[400px] flex justify-center align-middle items-center flex-col bg-[#e5dfdd] rounded-xl  shadow-lg">
        <p className="font-serif text-2xl text-center">
          Are you sure you want to sell rayfield land
        </p>
        {/* forms */}
        <div>
          <div>
            <label>Land index</label>
            <input type="number" placeholder="input land index" />
          </div>
          <div>
            <label>No of Plots</label>
            <input type="number" placeholder="input land index" />
          </div>
          <div>
            <label>Land index</label>
            <input type="number" placeholder="input Number of plots" />
          </div>
        </div>
        <div className="mt-10 w-[50%] flex flex-row justify-between align-middle items-center">
          <button
            onClick={handle_modal_close}
            className=" border border-black bg-gradient-to-r from-[#ece2dd] via-[#ce9f89] to-[#aca4a0] text-black font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out p-2 rounded-lg "
          >
            Cancel
          </button>
          <button className=" border border-black bg-gradient-to-r from-[#ece2dd] via-[#ce9f89] to-[#aca4a0] text-black font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out p-2 rounded-lg ml-4 ">
            Confirm
          </button>
        </div>
      </div>
    </section>
  );
};

export default Modal;


