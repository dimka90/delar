

import land from "../assets/land3.jpg";

interface Transaction {
  id: string;
  price: string;
  location: string;
  status: "Pending" | "Confirmed" | "Cancelled";
}

const transactions: Transaction[] = [
  {
    id: "0XmgkZR3UgYMCrpC654925374920v",
    price: "1.09 eth",
    location: "Rayfield, Jos",
    status: "Pending",
  },
  {
    id: "0XmgkZR3UgYMCrpC654925374920v",
    price: "1.09 eth",
    location: "Rayfield, Jos",
    status: "Confirmed",
  },
  {
    id: "0XmgkZR3UgYMCrpC654925374920v",
    price: "1.09 eth",
    location: "Rayfield, Jos",
    status: "Confirmed",
  },
  {
    id: "0XmgkZR3UgYMCrpC654925374920v",
    price: "1.09 eth",
    location: "Rayfield, Jos",
    status: "Cancelled",
  },
];

const getStatusClasses = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-400 text-yellow-800";
    case "Confirmed":
      return "bg-green-400 text-green-800";
    case "Cancelled":
      return "bg-red-400 text-red-800";
    default:
      return "";
  }
};

const TransactionHistory = () => {
  return (
    <div className="flex flex-col md:justify-center md:align-middle items-center mx-10">
      <h2 className="text-xl font-semibold text-gray-800 p-4">
        Transaction History
      </h2>
      <div className=" rounded-lg overflow-x-auto  h-full max-w-4xl mt-10 mx-4 border-2 p-2">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white table-auto">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4  text-left text-black whitespace-nowrap">
                  Transaction ID
                </th>
                <th className="py-2 px-4  text-left text-black">
                  Price
                </th>
                <th className="py-2 px-4  text-left text-black">
                  Location
                </th>
                <th className="py-2 px-4 text-left text-black">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={index} className="border-y border-[#80A23C]">
                  <td className="py-3 px-4 flex items-center whitespace-nowrap">
                    <img
                      src={land}
                      alt="transaction"
                      className="w-10 h-10 mr-3 hidden md:block"
                    />
                    <span className="text-sm">{transaction.id}</span>
                  </td>
                  <td className="py-3 px-4 text-sm">{transaction.price}</td>
                  <td className="py-3 px-4 text-sm">{transaction.location}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`py-1 px-3 rounded-full text-sm ${getStatusClasses(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;
