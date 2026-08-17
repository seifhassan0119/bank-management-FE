import {
  fetchCustomersApi,
  fetchAccountsApi,
  useBankCustomers,
  useBankAccounts,
} from "@/pages/customers/services/customerService";

export const useFetchCustomers = useBankCustomers;
export const useFetchAccounts = useBankAccounts;
export { fetchCustomersApi as fetchCustomers, fetchAccountsApi as fetchAccounts };