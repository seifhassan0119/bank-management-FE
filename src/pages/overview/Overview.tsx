import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  CreditCard,
  History,
  Wallet,
  ArrowRight,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Building,
  TrendingUp,
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
import { WelcomeSection } from "./Components/WelcomeSection";
import { useBank, fetchTransactionHistoryApi } from "@/pages/customers/services/customerService";
import { CustomerDialog } from "@/pages/customers/Components/CustomerDialog";
import { AccountDialog } from "@/components/modals/AccountDialog";
import { TransactionDialog } from "@/components/modals/TransactionDialog";
import { money, shortDate } from "@/lib/formatters";
import { toast } from "@/lib/toast";
import type { Account, Customer, Transaction } from "@/pages/customers/schema/types";

type EnrichedTransaction = Transaction & {
  account?: Account;
  customer?: Customer;
};

export default function Overview() {
  const navigate = useNavigate();
  const { customers, accounts, refetch, isLoading } = useBank();

  const [recentTransactions, setRecentTransactions] = useState<EnrichedTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isOpenAccountOpen, setIsOpenAccountOpen] = useState(false);
  const [txModal, setTxModal] = useState<{
    open: boolean;
    type: "DEPOSIT" | "WITHDRAW";
  }>({
    open: false,
    type: "DEPOSIT",
  });

  const loadRecentTransactions = async () => {
    if (accounts.length === 0) {
      setRecentTransactions([]);
      return;
    }
    setLoadingTx(true);
    try {
      const results = await Promise.all(
        accounts.map(async (acc) => {
          try {
            const list = await fetchTransactionHistoryApi(acc.id);
            const cust = customers.find(
              (c) => String(c.id) === String(acc.customerId)
            );
            return list.map((t) => ({
              ...t,
              account: acc,
              customer: cust,
            }));
          } catch {
            return [];
          }
        })
      );
      const flat = results.flat();
      flat.sort((a, b) => (b.id || 0) - (a.id || 0));
      setRecentTransactions(flat.slice(0, 6));
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    loadRecentTransactions();
  }, [accounts, customers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      await loadRecentTransactions();
      toast.success("Dashboard data refreshed");
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Metrics
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  }, [accounts]);

  const checkingCount = useMemo(() => {
    return accounts.filter((a) => String(a.accountType).toUpperCase() === "CHECKING").length;
  }, [accounts]);

  const savingsCount = useMemo(() => {
    return accounts.filter((a) => String(a.accountType).toUpperCase() === "SAVINGS").length;
  }, [accounts]);

  const topCustomers = useMemo(() => {
    return customers.slice(0, 5).map((c) => {
      const owned = accounts.filter(
        (a) => String(a.customerId) === String(c.id)
      );
      const bal = owned.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
      return {
        ...c,
        accountsCount: owned.length,
        totalBalance: bal,
      };
    });
  }, [customers, accounts]);

  return (
    <div className="space-y-8">
      {/* Top Header & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Financial Dashboard
          </h2>
          <p className="text-xs text-muted-foreground">
            Live overview of bank counters, liquidity, and customer portfolios
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-1.5 text-xs h-8 cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Hero Welcome Section */}
      <WelcomeSection
        onAddCustomer={() => setIsAddCustomerOpen(true)}
        onOpenAccount={() => setIsOpenAccountOpen(true)}
        onDeposit={() => setTxModal({ open: true, type: "DEPOSIT" })}
        onWithdraw={() => setTxModal({ open: true, type: "WITHDRAW" })}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Customers */}
        <Card className="p-5 border shadow-sm flex items-center justify-between bg-card hover:border-primary/40 transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Customers
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {isLoading ? "..." : customers.length}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <ShieldCheck className="size-3" />
              100% KYC Verified
            </p>
          </div>
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
        </Card>

        {/* Metric 2: Accounts */}
        <Card className="p-5 border shadow-sm flex items-center justify-between bg-card hover:border-blue-500/40 transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bank Accounts
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {isLoading ? "..." : accounts.length}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">
              {checkingCount} Checking · {savingsCount} Savings
            </p>
          </div>
          <div className="grid size-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CreditCard className="size-6" />
          </div>
        </Card>

        {/* Metric 3: Total Liquidity */}
        <Card className="p-5 border shadow-sm flex items-center justify-between bg-card hover:border-emerald-500/40 transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Liquidity
            </p>
            <p className="text-2xl font-bold font-mono text-foreground mt-1">
              {isLoading ? "..." : money(totalBalance)}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="size-3" />
              Active Reserves
            </p>
          </div>
          <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Wallet className="size-6" />
          </div>
        </Card>

        {/* Metric 4: Operations */}
        <Card className="p-5 border shadow-sm flex items-center justify-between bg-card hover:border-amber-500/40 transition-colors">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Logged Operations
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {loadingTx ? "..." : recentTransactions.length > 0 ? `${recentTransactions.length}+` : "0"}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium mt-1 flex items-center gap-1">
              <History className="size-3 text-primary" />
              Real-time Ledger
            </p>
          </div>
          <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <History className="size-6" />
          </div>
        </Card>
      </div>

      {/* Feature Hub Action Panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Customers Panel */}
        <Card className="p-6 border shadow-sm flex flex-col justify-between bg-card hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-foreground">
                {customers.length} Profiles
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground mt-4">
              Customer Management
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Register clients, inspect individual KYC identity profiles, link multi-currency accounts, and update contact data.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-6 mt-4 border-t">
            <Button
              asChild
              className="flex-1 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Link to="/customers">
                View Customers
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddCustomerOpen(true)}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Plus className="size-3.5" />
              Add Customer
            </Button>
          </div>
        </Card>

        {/* Bank Accounts Panel */}
        <Card className="p-6 border shadow-sm flex flex-col justify-between bg-card hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building className="size-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {accounts.length} Accounts
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground mt-4">
              Bank Accounts Hub
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Open checking and savings accounts, manage balances, and handle account closures with instant ledger tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-6 mt-4 border-t">
            <Button
              asChild
              className="flex-1 gap-1.5 text-xs font-semibold cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link to="/accounts">
                View All Accounts
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpenAccountOpen(true)}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <Plus className="size-3.5" />
              Open Account
            </Button>
          </div>
        </Card>

        {/* Financial Transactions Panel */}
        <Card className="p-6 border shadow-sm flex flex-col justify-between bg-card hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <History className="size-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Live Ledger
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground mt-4">
              Financial Transactions
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Process instant cash deposits and validated withdrawals with real-time balance calculations and audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-6 mt-4 border-t">
            <Button
              asChild
              className="flex-1 gap-1.5 text-xs font-semibold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Link to="/transactions">
                Open Ledger
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTxModal({ open: true, type: "DEPOSIT" })}
              className="gap-1 text-xs text-emerald-600 hover:text-emerald-700 border-emerald-500/20 cursor-pointer"
            >
              <ArrowDownRight className="size-3.5" />
              Deposit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTxModal({ open: true, type: "WITHDRAW" })}
              className="gap-1 text-xs text-amber-600 hover:text-amber-700 border-amber-500/20 cursor-pointer"
            >
              <ArrowUpRight className="size-3.5" />
              Withdraw
            </Button>
          </div>
        </Card>
      </div>

      {/* Two Column Section: Recent Customers & Recent Transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Customers Directory Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                Recent Customer Profiles
              </h3>
            </div>
            <Link
              to="/customers"
              className="text-xs font-medium text-primary hover:underline"
            >
              View All ({customers.length}) →
            </Link>
          </div>

          <Card className="overflow-hidden border shadow-sm">
            <div className="divide-y">
              {topCustomers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No customers registered in the database.
                </div>
              ) : (
                topCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => navigate(`/customers/${cust.id}`)}
                    className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {cust.firstName?.[0] || "C"}
                        {cust.lastName?.[0] || ""}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {cust.firstName} {cust.lastName}
                          <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: #{cust.id} · National ID: {cust.nationalId}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold text-sm text-foreground">
                        {money(cust.totalBalance)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {cust.accountsCount} {cust.accountsCount === 1 ? "account" : "accounts"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Live Transaction Ledger Feed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="size-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                Recent Transaction Feed
              </h3>
            </div>
            <Link
              to="/transactions"
              className="text-xs font-medium text-primary hover:underline"
            >
              View Full Ledger →
            </Link>
          </div>

          <Card className="overflow-hidden border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-16">Tx</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTx ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                      <RefreshCw className="size-4 animate-spin mx-auto mb-1 text-primary" />
                      Loading recent ledger...
                    </TableCell>
                  </TableRow>
                ) : recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                      No recent transactions recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((tx) => {
                    const isDeposit = String(tx.type).toUpperCase().includes("DEPOSIT");
                    return (
                      <TableRow key={tx.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{tx.id}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              isDeposit
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isDeposit ? (
                              <ArrowDownRight className="size-3" />
                            ) : (
                              <ArrowUpRight className="size-3" />
                            )}
                            {tx.type}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-bold text-xs ${
                            isDeposit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isDeposit ? "+" : "-"}
                          {money(Number(tx.amount) || 0)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-foreground">
                          #{tx.account?.accountNumber || tx.accountId}
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
      </div>

      {/* Add Customer Modal */}
      <CustomerDialog
        open={isAddCustomerOpen}
        onOpenChange={setIsAddCustomerOpen}
      />

      {/* Open Account Modal */}
      <AccountDialog
        open={isOpenAccountOpen}
        onOpenChange={setIsOpenAccountOpen}
        onSuccess={() => refetch()}
      />

      {/* Transaction Modal (Deposit / Withdraw) */}
      <TransactionDialog
        open={txModal.open}
        onOpenChange={(open) => setTxModal((p) => ({ ...p, open }))}
        defaultType={txModal.type}
        accounts={accounts}
        onSuccess={async () => {
          await refetch();
          await loadRecentTransactions();
        }}
      />
    </div>
  );
}