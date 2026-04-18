import "./App.css";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAppKitAccount } from "@reown/appkit/react";
import Root from "./Root";
import LandsForSale from "./pages/LandsForSale.tsx";
import TransactionHistory from "./pages/TransactionHistory";
import Register from "./pages/Register";
import DashBoard from "./pages/Dashboard";
import MyLands from "./pages/MyLands";
import AllLands from "./pages/AllLands";
import RecordDetails from "./pages/RecordDetails";

import "../connection";
import Home from "./components/Home.tsx";

const ProtectedRoutes = () => {
  const { address } = useAppKitAccount();

  if (!address) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<Root />}>
          <Route index element={<Home />} />
          <Route path="/listings" element={<LandsForSale />} />
          <Route path="/record/:owner/:landIndex" element={<RecordDetails />} />
          <Route path="/transaction/history" element={<TransactionHistory />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/register" element={<Register />} />
          <Route path="/lands/user" element={<MyLands />} />
          <Route path="/lands/all" element={<AllLands />} />
          <Route path="/dashboard" element={<DashBoard />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Route>
    )
  );

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
