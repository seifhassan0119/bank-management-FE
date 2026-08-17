import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  CreditCard,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Edit3,
  Building2,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBank, fetchTransactionHistoryApi } from "./services/customerService";
import { CustomerDialog } from "./Components/CustomerDialog";
import { AccountDialog } from "@/components/modals/AccountDialog";
import { TransactionDialog } from "@/components/modals/TransactionDialog";
import { TransactionHistoryDialog } from "@/components/modals/TransactionHistoryDialog";
import { StatusBadge } from "./Components/StatusBadge";
import { money, shortDate } from "@/lib/formatters";
import { toast } from "@/lib/toast";
import type { Account, Transaction } from "./schema/types";

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    customers,
    accounts,
    deleteAccount,
    refetch,
    isLoading: loadingBank,
  } = useBank();

  const customer = useMemo(() => {
    return customers.find((c) => String(c.id) === String(id)) || null;
  }, [customers, id]);

  const customerAccounts = useMemo(() => {
    if (!id) return [];
    return accounts.filter((a) => String(a.customerId) === String(id));
  }, [accounts, id]);

  // Combined transactions ledger
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState<boolean>(false);
  const [selectedTxAccount, setSelectedTxAccount] = useState<string>("all");

  // Modals state
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isOpenAccountOpen, setIsOpenAccountOpen] = useState(false);
  const [txModal, setTxModal] = useState<{
    open: boolean;
    type: "DEPOSIT" | "WITHDRAW";
    account: Account | null;
  }>({
    open: false,
    type: "DEPOSIT",
    account: null,
  });
  const [historyModalAccount, setHistoryModalAccount] = useState<Account | null>(null);
  const [pendingDeleteAccountId, setPendingDeleteAccountId] = useState<number | null>(null);

  const loadAllTransactions = async () => {
    if (customerAccounts.length === 0) {
      setAllTransactions([]);
      return;
    }
    setLoadingTx(true);
    try {
      const results = await Promise.all(
        customerAccounts.map(async (acc) => {
          try {
            const list = await fetchTransactionHistoryApi(acc.id);
            return list.map((t) => ({ ...t, accountObj: acc }));
          } catch {
            return [];
          }
        })
      );
      const flat = results.flat();
      flat.sort((a, b) => (b.id || 0) - (a.id || 0));
      setAllTransactions(flat);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    loadAllTransactions();
  }, [customerAccounts]);

  const totalBalance = useMemo(() => {
    return customerAccounts.reduce(
      (sum, a) => sum + (Number(a.balance) || 0),
      0
    );
  }, [customerAccounts]);

  const filteredTransactions = useMemo(() => {
    if (selectedTxAccount === "all") return allTransactions;
    return allTransactions.filter(
      (t) => String(t.accountId) === String(selectedTxAccount)
    );
  }, [allTransactions, selectedTxAccount]);

  const handleDeleteAccount = async () => {
    if (!pendingDeleteAccountId) return;
    try {
      await deleteAccount(pendingDeleteAccountId);
      toast.success("Account deleted successfully");
      await refetch();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to delete account";
      toast.error(msg);
    } finally {
      setPendingDeleteAccountId(null);
    }
  };

  if (!customer && !loadingBank) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/customers")}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to Customers
        </Button>
        <Card className="p-12 text-center">
          <User className="size-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-bold text-foreground">Customer Not Found</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            The customer with ID #{id} was not found in the database.
          </p>
          <Button
            onClick={() => navigate("/customers")}
            className="mt-4"
            size="sm"
          >
            View Customer Directory
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/customers")}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            Customers
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-semibold text-foreground">
            {customer ? `${customer.firstName} ${customer.lastName}` : "Customer Profile"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await refetch();
              await loadAllTransactions();
              toast.success("Customer data refreshed");
            }}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditCustomerOpen(true)}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <Edit3 className="size-3.5" />
            Edit Profile
          </Button>
          <Button
            size="sm"
            onClick={() => setIsOpenAccountOpen(true)}
            className="gap-1.5 text-xs h-9 shadow-sm cursor-pointer"
          >
            <Plus className="size-3.5" />
            Open Account
          </Button>
        </div>
      </div>

      {/* Customer Hero Profile Card */}
      <Card className="p-6 border shadow-sm bg-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-xl font-bold text-primary shadow-inner">
              {customer?.firstName?.[0] || "C"}
              {customer?.lastName?.[0] || ""}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-foreground">
                  {customer?.firstName} {customer?.lastName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  KYC Verified
                </span>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Customer ID: #{customer?.id} · National ID:{" "}
                <span className="text-foreground font-semibold">
                  {customer?.nationalId}
                </span>
              </p>

              {/* Personal Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5 text-primary/70 shrink-0" />
                  <span className="text-foreground truncate">{customer?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-3.5 text-primary/70 shrink-0" />
                  <span className="text-foreground">{customer?.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-3.5 text-primary/70 shrink-0" />
                  <span>DOB: {customer?.dob ? shortDate(customer.dob) : "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-3.5 text-primary/70 shrink-0" />
                  <span className="truncate">{customer?.address || "Address on file"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6">
            <div className="min-w-36 p-3 rounded-xl bg-muted/40 border">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Wallet className="size-3.5 text-primary" />
                Total Balance
              </p>
              <p className="text-xl font-bold font-mono text-foreground mt-1">
                {money(totalBalance)}
              </p>
            </div>
            <div className="min-w-28 p-3 rounded-xl bg-muted/40 border">
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <CreditCard className="size-3.5 text-primary" />
                Accounts
              </p>
              <p className="text-xl font-bold text-foreground mt-1">
                {customerAccounts.length}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Linked Accounts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Linked Bank Accounts ({customerAccounts.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/accounts"
              className="text-xs text-primary hover:underline font-medium"
            >
              View in Accounts Hub →
            </Link>
          </div>
        </div>

        {customerAccounts.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <CreditCard className="size-10 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-sm font-semibold text-foreground">
              No bank accounts opened yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Open a checking or savings account for this customer to begin transactions.
            </p>
            <Button
              size="sm"
              onClick={() => setIsOpenAccountOpen(true)}
              className="mt-4 gap-1.5 text-xs"
            >
              <Plus className="size-3.5" />
              Open First Account
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {customerAccounts.map((acc) => (
              <Card
                key={acc.id}
                className="p-5 border shadow-sm bg-card hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-foreground">
                        #{acc.accountNumber}
                      </span>
                      <StatusBadge value={acc.accountType} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {acc.status}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold font-mono text-foreground mt-0.5">
                      {money(Number(acc.balance) || 0)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {acc.currency}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Account Action Buttons */}
                <div className="pt-5 mt-4 border-t grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTxModal({
                        open: true,
                        type: "DEPOSIT",
                        account: acc,
                      })
                    }
                    className="gap-1 text-xs h-8 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 cursor-pointer"
                  >
                    <ArrowDownRight className="size-3.5" />
                    Deposit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTxModal({
                        open: true,
                        type: "WITHDRAW",
                        account: acc,
                      })
                    }
                    className="gap-1 text-xs h-8 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 cursor-pointer"
                  >
                    <ArrowUpRight className="size-3.5" />
                    Withdraw
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHistoryModalAccount(acc)}
                    className="gap-1 text-xs h-8 cursor-pointer"
                    title="View history"
                  >
                    <History className="size-3.5" />
                    History
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Customer Transactions Ledger */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Customer Transaction Ledger
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {customerAccounts.length > 1 && (
              <select
                value={selectedTxAccount}
                onChange={(e) => setSelectedTxAccount(e.target.value)}
                className="rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Accounts ({customerAccounts.length})</option>
                {customerAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    Account #{a.accountNumber} ({a.accountType})
                  </option>
                ))}
              </select>
            )}

            {customerAccounts.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setTxModal({
                      open: true,
                      type: "DEPOSIT",
                      account: customerAccounts[0],
                    })
                  }
                  className="gap-1 text-xs h-8 text-emerald-600 hover:text-emerald-700 border-emerald-500/20 cursor-pointer"
                >
                  <ArrowDownRight className="size-3.5" />
                  Quick Deposit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setTxModal({
                      open: true,
                      type: "WITHDRAW",
                      account: customerAccounts[0],
                    })
                  }
                  className="gap-1 text-xs h-8 text-amber-600 hover:text-amber-700 border-amber-500/20 cursor-pointer"
                >
                  <ArrowUpRight className="size-3.5" />
                  Quick Withdraw
                </Button>
              </>
            )}
          </div>
        </div>

        <Card className="overflow-hidden border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-20">Tx ID</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance After</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTx ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="size-4 animate-spin mx-auto mb-2 text-primary" />
                    Loading customer transaction ledger...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <p className="font-medium text-foreground">No transactions recorded</p>
                    <p className="text-xs mt-0.5">
                      Deposits and withdrawals on linked accounts will be logged here.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => {
                  const isDeposit = String(tx.type).toUpperCase().includes("DEPOSIT");
                  const matchedAcc = customerAccounts.find(
                    (a) => String(a.id) === String(tx.accountId)
                  );
                  return (
                    <TableRow key={tx.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{tx.id}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium text-xs text-foreground">
                          #{matchedAcc?.accountNumber || tx.accountId}
                        </span>
                        {matchedAcc && (
                          <span className="text-[11px] text-muted-foreground ml-1.5">
                            ({matchedAcc.accountType})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isDeposit
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownRight className="size-3.5" />
                          ) : (
                            <ArrowUpRight className="size-3.5" />
                          )}
                          {tx.type}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-bold text-sm ${
                          isDeposit
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isDeposit ? "+" : "-"}
                        {money(Number(tx.amount) || 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {tx.balanceAfter ? money(Number(tx.balanceAfter)) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-foreground max-w-[200px] truncate">
                        {tx.description || "General Banking Operation"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {tx.timestamp ? shortDate(tx.timestamp) : "Recent"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Edit Customer Dialog */}
      <CustomerDialog
        customer={customer}
        open={isEditCustomerOpen}
        onOpenChange={setIsEditCustomerOpen}
      />

      {/* Open Account Dialog */}
      <AccountDialog
        open={isOpenAccountOpen}
        onOpenChange={setIsOpenAccountOpen}
        customer={customer}
        customerId={customer?.id}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Transaction Modal (Deposit / Withdraw) */}
      <TransactionDialog
        open={txModal.open}
        onOpenChange={(open) => setTxModal((p) => ({ ...p, open }))}
        defaultType={txModal.type}
        account={txModal.account}
        accounts={customerAccounts}
        onSuccess={async () => {
          await refetch();
          await loadAllTransactions();
        }}
      />

      {/* Account Transaction History Dialog */}
      <TransactionHistoryDialog
        open={historyModalAccount !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryModalAccount(null);
        }}
        account={historyModalAccount}
      />

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog
        open={pendingDeleteAccountId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteAccountId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close / Delete Bank Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Account #{pendingDeleteAccountId}? This will permanently remove the account record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Account</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
