import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/api/axiosInstance";
import type {
  Customer,
  Account,
  Transaction,
  CustomerFormData,
  AccountFormData,
  TransactionFormData,
  PageResponse,
} from "../schema/types";

export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_ACCOUNTS: Account[] = [];

let localCustomers: Customer[] = [...INITIAL_CUSTOMERS];
let localAccounts: Account[] = [...INITIAL_ACCOUNTS];

const normalizeList = <T>(data: any): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (typeof data === "object" && data.id !== undefined) return [data];
  return [];
};

// --- Customer Endpoints ---

export const fetchCustomersApi = async (
  page = 0,
  size = 100
): Promise<Customer[]> => {
  try {
    const response = await axiosInstance.get<PageResponse<Customer> | Customer[]>(
      "/customers",
      {
        params: { page, size },
      }
    );
    const list = normalizeList<Customer>(response.data);
    localCustomers = list;
    return list;
  } catch (err) {
    try {
      const response2 = await axiosInstance.get<PageResponse<Customer> | Customer[]>(
        "/customers/",
        { params: { page, size } }
      );
      const list2 = normalizeList<Customer>(response2.data);
      localCustomers = list2;
      return list2;
    } catch {
      console.warn("Backend /customers call failed, using local cache:", err);
      return [...localCustomers];
    }
  }
};

export const fetchCustomerByIdApi = async (
  id: number
): Promise<Customer | null> => {
  try {
    const response = await axiosInstance.get<Customer>(`/customers/${id}`);
    return response.data;
  } catch (err) {
    console.warn(`Backend /customers/${id} failed:`, err);
    return localCustomers.find((c) => c.id === id) || null;
  }
};

export const createCustomerApi = async (
  formData: CustomerFormData
): Promise<Customer> => {
  const payload = {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    phone: formData.phone.replace(/\D/g, "") || "0100000000",
    nationalId: formData.nationalId.replace(/\D/g, "") || String(Date.now()).slice(-10),
    dob: formData.dob || "2000-01-01",
    address: formData.address?.trim() || "Main Street",
  };

  try {
    const res = await axiosInstance.post<Customer[] | Customer>("/customers/", [payload]);
    if (res.data) {
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data[0];
      } else if ((res.data as any).id) {
        return res.data as Customer;
      }
    }
  } catch {
    const res2 = await axiosInstance.post<Customer[] | Customer>("/customers", [payload]);
    if (res2.data) {
      if (Array.isArray(res2.data) && res2.data.length > 0) {
        return res2.data[0];
      } else if ((res2.data as any).id) {
        return res2.data as Customer;
      }
    }
  }

  return {
    id: Date.now(),
    ...payload,
    createdAt: new Date().toISOString(),
  };
};

export const updateCustomerApi = async (
  id: number,
  formData: CustomerFormData
): Promise<Customer> => {
  const payload = {
    id,
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    phone: formData.phone.replace(/\D/g, "") || "0100000000",
    nationalId: formData.nationalId.replace(/\D/g, "") || String(Date.now()).slice(-10),
    dob: formData.dob || "2000-01-01",
    address: formData.address?.trim() || "Main Street",
  };

  const res = await axiosInstance.put<Customer>(`/customers/${id}`, payload);
  if (res.data && res.data.id) {
    return res.data;
  }

  return {
    ...payload,
    updatedAt: new Date().toISOString(),
  };
};

export const deleteCustomerApi = async (id: number): Promise<number> => {
  await axiosInstance.delete(`/customers/${id}`);
  return id;
};

// --- Account Endpoints ---

export const fetchAccountsApi = async (): Promise<Account[]> => {
  try {
    const response = await axiosInstance.get<Account[]>("/accounts/");
    const list = normalizeList<Account>(response.data);
    localAccounts = list;
    return list;
  } catch (err) {
    try {
      const response2 = await axiosInstance.get<Account[]>("/accounts");
      const list2 = normalizeList<Account>(response2.data);
      localAccounts = list2;
      return list2;
    } catch {
      console.warn("Backend /accounts/ call failed, using local cache:", err);
      return [...localAccounts];
    }
  }
};

export const createAccountApi = async (
  formData: AccountFormData
): Promise<Account> => {
  const payload = {
    customerId: String(formData.customerId),
    accountNumber: formData.accountNumber.replace(/\D/g, ""),
    accountType: formData.accountType.toUpperCase(),
    balance: String(formData.balance || "0.00"),
    currency: (formData.currency || "USD").toUpperCase(),
    status: (formData.status || "ACTIVE").toUpperCase(),
  };

  const res = await axiosInstance.post<Account>("/accounts/", payload);
  if (res.data) {
    return res.data;
  }
  throw new Error("Failed to create account");
};

export const deleteAccountApi = async (id: number): Promise<number> => {
  await axiosInstance.delete(`/accounts/${id}`);
  return id;
};

// --- Transaction Endpoints ---

export const depositApi = async (
  formData: TransactionFormData
): Promise<Transaction> => {
  const payload = {
    accountId: String(formData.accountId),
    amount: String(formData.amount),
    description: formData.description || "Deposit",
  };
  const res = await axiosInstance.post<Transaction>("/transactions/deposit", payload);
  return res.data;
};

export const withdrawApi = async (
  formData: TransactionFormData
): Promise<Transaction> => {
  const payload = {
    accountId: String(formData.accountId),
    amount: String(formData.amount),
    description: formData.description || "Withdrawal",
  };
  const res = await axiosInstance.post<Transaction>("/transactions/withdraw", payload);
  return res.data;
};

export const fetchTransactionHistoryApi = async (
  accountId: string | number
): Promise<Transaction[]> => {
  const res = await axiosInstance.get<Transaction[]>(
    `/transactions/history/${accountId}`
  );
  return normalizeList<Transaction>(res.data);
};

// --- React Query Hooks ---

export const useBankCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => fetchCustomersApi(0, 100),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useBankAccounts = () => {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccountsApi,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useBank = () => {
  const queryClient = useQueryClient();

  const {
    data: customers = [],
    isLoading: loadingCustomers,
    refetch: refetchCust,
  } = useBankCustomers();

  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    refetch: refetchAcc,
  } = useBankAccounts();

  const deleteCustomerMutation = useMutation({
    mutationFn: deleteCustomerApi,
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Customer[]>(["customers"], (old = []) =>
        old.filter((c) => c.id !== deletedId)
      );
      queryClient.setQueryData<Account[]>(["accounts"], (old = []) =>
        old.filter((a) => String(a.customerId) !== String(deletedId))
      );
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: createCustomerApi,
    onSuccess: (newCust) => {
      queryClient.setQueryData<Customer[]>(["customers"], (old = []) => {
        const filtered = old.filter((c) => c.id !== newCust.id);
        return [newCust, ...filtered];
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomerFormData }) =>
      updateCustomerApi(id, data),
    onSuccess: (updatedCust) => {
      queryClient.setQueryData<Customer[]>(["customers"], (old = []) =>
        old.map((c) => (c.id === updatedCust.id ? { ...c, ...updatedCust } : c))
      );
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: createAccountApi,
    onSuccess: (newAcc) => {
      queryClient.setQueryData<Account[]>(["accounts"], (old = []) => [
        ...old,
        newAcc,
      ]);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccountApi,
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Account[]>(["accounts"], (old = []) =>
        old.filter((a) => a.id !== deletedId)
      );
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const depositMutation = useMutation({
    mutationFn: depositApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: withdrawApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const deleteCustomer = useCallback(
    async (id: number) => {
      return await deleteCustomerMutation.mutateAsync(id);
    },
    [deleteCustomerMutation]
  );

  const createCustomer = useCallback(
    async (data: CustomerFormData) => {
      return await createCustomerMutation.mutateAsync(data);
    },
    [createCustomerMutation]
  );

  const updateCustomer = useCallback(
    async (id: number, data: CustomerFormData) => {
      return await updateCustomerMutation.mutateAsync({ id, data });
    },
    [updateCustomerMutation]
  );

  const createAccount = useCallback(
    async (data: AccountFormData) => {
      return await createAccountMutation.mutateAsync(data);
    },
    [createAccountMutation]
  );

  const deleteAccount = useCallback(
    async (id: number) => {
      return await deleteAccountMutation.mutateAsync(id);
    },
    [deleteAccountMutation]
  );

  const deposit = useCallback(
    async (data: TransactionFormData) => {
      return await depositMutation.mutateAsync(data);
    },
    [depositMutation]
  );

  const withdraw = useCallback(
    async (data: TransactionFormData) => {
      return await withdrawMutation.mutateAsync(data);
    },
    [withdrawMutation]
  );

  const refetch = useCallback(async () => {
    await Promise.all([refetchCust(), refetchAcc()]);
  }, [refetchCust, refetchAcc]);

  return {
    customers,
    accounts,
    deleteCustomer,
    createCustomer,
    updateCustomer,
    createAccount,
    deleteAccount,
    deposit,
    withdraw,
    refetch,
    isLoading: loadingCustomers || loadingAccounts,
  };
};
