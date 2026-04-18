const Table = () => {
  return (
    <div className="mt-10">
      <table className="w-full mx-2 md:mx-0">
        <thead className="">
          <tr className="text-left border-b-2  ">
            <th className="px-4 py-2 text-left text-xs md:text-sm  text-gray-700 border-b font-bold">
              Owner
            </th>
            <th className="px-4 py-2 text-left text-xs md:text-sm font-bold text-gray-700 border-b">
              Status
            </th>
            <th className="px-4 py-2 text-left text-xs md:text-sm font-bold text-gray-700 border-b">
              Listing status
            </th>
            <th className="hidden md:block px-4 py-2 text-left text-xs md:text-sm font-bold text-gray-700 border-b">
              Registration Date
            </th>
            <th className="px-4 py-2 text-left text-xs md:text-sm font-bold text-gray-700 border-b"></th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-left ">
            <td className="md:px-4 py-2 text-gray-800 border-b">
              <p className="font-semibold text-[#5C4033] text-xs md:text-base ">
                0XmghZR3UgYMCr...pC
              </p>
              <h2 className="font-light">James victor</h2>
            </td>
            <td className="px-1 md:px-4 py-2 text-gray-800 border-b">Pending</td>
              <td className="px-4 py-2 text-gray-800 border-b ">
                <p className="bg-green-400 text-center text-xs md:text-lg rounded-2xl py-2 text-white">
                unlisted
                </p> 
              </td>
            <td className="hidden md:block px-1 md:px-4 py-2 text-xs md:text-xl text-gray-800 border-b">Jan 24 2024</td>
            <td className="px-1 md:px-4 py-2 text-gray-800 border-b">
              <button className="py-1 px-3 rounded-lg bg-gradient-to-r from-[#ece2dd] via-[#ce9f89] to-[#aca4a0] text-black font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out">
                Verify
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Table;
