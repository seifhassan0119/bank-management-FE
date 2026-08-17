export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  dob?: string;
  address?: string;
  city?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Account {
  id: number;
  customerId: string | number;
  accountNumber: string;
  accountType: "SAVINGS" | "CHECKING" | "Checking" | "Savings" | "Business" | "Investment" | string;
  balance: number | string;
  currency: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED" | "CLOSED" | "Active" | "Inactive" | "open" | string;
  createdAt?: string;
}

export interface Transaction {
  id: number;
  accountId: string | number;
  type: "DEPOSIT" | "WITHDRAW" | "TRANSFER" | string;
  amount: number | string;
  balanceAfter?: string | number;
  description?: string;
  timestamp?: string | null;
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  dob?: string;
  address?: string;
  city?: string;
}

export interface AccountFormData {
  customerId: string | number;
  accountNumber: string;
  accountType: "SAVINGS" | "CHECKING" | string;
  balance: string | number;
  currency: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED" | "CLOSED" | string;
}

export interface TransactionFormData {
  accountId: string | number;
  amount: string | number;
  description?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export type Row = Customer & {
  totalBalance: number;
  accountTypes: string[];
};
