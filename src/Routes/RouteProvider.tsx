import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../Layout/MainLayout";
import NotFoundPage from "../pages/NotFoundPage";
import Overview from "@/pages/overview/Overview";
import CustomersPage from "@/pages/customers/CustomersPage";
import CustomerProfilePage from "@/pages/customers/CustomerProfilePage";
import AccountsPage from "@/pages/accounts/AccountsPage";
import TransactionsPage from "@/pages/transactions/TransactionsPage";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: "overview", element: <Overview /> },
      { path: "customers", element: <CustomersPage /> },
      { path: "customers/:id", element: <CustomerProfilePage /> },
      { path: "accounts", element: <AccountsPage /> },
      { path: "transactions", element: <TransactionsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);