import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  legacyCreateColumnHelper as createColumnHelper,
  useLegacyTable as useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { flexRender, type SortingState } from "@tanstack/react-table";
import {
  History,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBank, fetchTransactionHistoryApi } from "@/pages/customers/services/customerService";
import { TransactionDialog } from "@/components/modals/TransactionDialog";
import { money, shortDate } from "@/lib/formatters";
import { toast } from "@/lib/toast";
import type { Account, Customer, Transaction } from "@/pages/customers/schema/types";

type EnrichedTransaction = Transaction & {
  account?: Account;
  customer?: Customer;
};

const columnHelper = createColumnHelper<EnrichedTransaction>();

export default function TransactionsPage() {
  const { accounts, customers, refetch } = useBank();

  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [accountFilter, setAccountFilter] = useState<string>("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Transaction Modal State
  const [txModal, setTxModal] = useState<{
    open: boolean;
    type: "DEPOSIT" | "WITHDRAW";
  }>({
    open: false,
    type: "DEPOSIT",
  });

  const loadAllTransactions = async () => {
    if (accounts.length === 0) {
      setTransactions([]);
      return;
    }
    setLoading(true);
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
      setTransactions(flat);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllTransactions();
  }, [accounts, customers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      await loadAllTransactions();
      toast.success("Transaction ledger updated");
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "ALL") {
        const isDep = String(tx.type).toUpperCase().includes("DEPOSIT");
        if (typeFilter === "DEPOSIT" && !isDep) return false;
        if (typeFilter === "WITHDRAW" && isDep) return false;
      }
      if (accountFilter !== "ALL") {
        if (String(tx.accountId) !== String(accountFilter)) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, accountFilter]);

  // Volume metrics
  const totalDepositedVolume = useMemo(() => {
    return transactions
      .filter((t) => String(t.type).toUpperCase().includes("DEPOSIT"))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const totalWithdrawnVolume = useMemo(() => {
    return transactions
      .filter((t) => !String(t.type).toUpperCase().includes("DEPOSIT"))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const netFlow = totalDepositedVolume - totalWithdrawnVolume;

  const columns = useMemo<LegacyColumnDef<EnrichedTransaction, any>[]>(
    () => [
      columnHelper.accessor("id", {
        header: "Tx ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            #{getValue() as number}
          </span>
        ),
      }),
      columnHelper.accessor("type", {
        header: "Operation",
        cell: ({ getValue }) => {
          const typeStr = String(getValue()).toUpperCase();
          const isDeposit = typeStr.includes("DEPOSIT");
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
              {typeStr}
            </span>
          );
        },
      }),
      columnHelper.accessor("amount", {
        header: "Amount",
        cell: ({ row }) => {
          const isDeposit = String(row.original.type).toUpperCase().includes("DEPOSIT");
          const currency = row.original.account?.currency || "USD";
          return (
            <div className="text-right">
              <p
                className={`font-mono font-bold text-sm ${
                  isDeposit
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isDeposit ? "+" : "-"}
                {money(Number(row.original.amount) || 0)}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">{currency}</p>
            </div>
          );
        },
        meta: { className: "text-right", headerClassName: "text-right" },
      }),
      columnHelper.accessor("balanceAfter", {
        header: "Balance After",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {getValue() ? money(Number(getValue())) : "—"}
          </span>
        ),
        meta: { className: "text-right", headerClassName: "text-right" },
      }),
      columnHelper.accessor((row) => row.account?.accountNumber || row.accountId, {
        id: "account",
        header: "Target Account",
        cell: ({ row }) => {
          const acc = row.original.account;
          const cust = row.original.customer;
          return (
            <div>
              <p className="font-mono font-medium text-xs text-foreground">
                #{acc?.accountNumber || row.original.accountId}
              </p>
              {cust && (
                <Link
                  to={`/customers/${cust.id}`}
                  className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                >
                  {cust.firstName} {cust.lastName}
                  <ExternalLink className="size-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </Link>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("description", {
        header: "Description / Memo",
        cell: ({ getValue }) => (
          <span className="text-xs text-foreground max-w-[240px] truncate block">
            {(getValue() as string) || "Standard transaction"}
          </span>
        ),
      }),
      columnHelper.accessor("timestamp", {
        header: "Timestamp",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {getValue() ? shortDate(getValue() as string) : "Recent"}
          </span>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row: { original: EnrichedTransaction }, _columnId: string, value: string) => {
      const q = String(value).trim().toLowerCase();
      if (!q) return true;
      const t = row.original;
      return [
        String(t.id),
        t.type,
        String(t.amount),
        t.description,
        t.account?.accountNumber,
        t.customer?.firstName,
        t.customer?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  const rowCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Transaction Ledger
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Loading transaction logs..."
              : `Auditing ${transactions.length} operations across active bank accounts`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setTxModal({ open: true, type: "DEPOSIT" })}
            className="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
          >
            <ArrowDownRight className="size-3.5" />
            Deposit
          </Button>
          <Button
            size="sm"
            onClick={() => setTxModal({ open: true, type: "WITHDRAW" })}
            className="gap-1.5 text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer"
          >
            <ArrowUpRight className="size-3.5" />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border shadow-sm flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Deposits</p>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{money(totalDepositedVolume)}
            </p>
          </div>
        </Card>

        <Card className="p-4 border shadow-sm flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <TrendingDown className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Withdrawals</p>
            <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              -{money(totalWithdrawnVolume)}
            </p>
          </div>
        </Card>

        <Card className="p-4 border shadow-sm flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Net Ledger Flow</p>
            <p className="text-xl font-bold font-mono text-foreground mt-0.5">
              {netFlow >= 0 ? "+" : ""}
              {money(netFlow)}
            </p>
          </div>
        </Card>

        <Card className="p-4 border shadow-sm flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <History className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Transactions</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{transactions.length}</p>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden border shadow-sm">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search memo, account #, customer..."
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Account Filter */}
            {accounts.length > 0 && (
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Accounts ({accounts.length})</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    Account #{a.accountNumber} ({a.accountType})
                  </option>
                ))}
              </select>
            )}

            {/* Type Switcher */}
            <div className="flex items-center bg-muted/60 p-1 rounded-lg">
              {["ALL", "DEPOSIT", "WITHDRAW"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    typeFilter === t
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {globalFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGlobalFilter("")}
                className="text-xs text-muted-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Table View */}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group: any) => (
              <TableRow key={group.id} className="bg-muted/40 hover:bg-muted/40">
                {group.headers.map((header: any) => {
                  const meta = header.column.columnDef.meta as
                    | { className?: string; headerClassName?: string }
                    | undefined;
                  const sortable = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      className={[meta?.className, meta?.headerClassName]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          <ArrowUpDown className="size-3.5 opacity-60" />
                        </button>
                      ) : (
                        <span className="font-semibold text-foreground">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row: any) => (
              <TableRow
                key={row.id}
                className="transition-colors hover:bg-muted/30"
              >
                {row.getVisibleCells().map((cell: any) => {
                  const meta = cell.column.columnDef.meta as
                    | { className?: string }
                    | undefined;
                  return (
                    <TableCell key={cell.id} className={meta?.className}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {!table.getRowModel().rows.length && (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length}
                  className="py-16 text-center"
                >
                  <div className="mx-auto flex flex-col items-center justify-center gap-2 max-w-sm">
                    <div className="grid size-12 place-items-center rounded-full bg-muted">
                      <History className="size-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">No transactions found</p>
                    <p className="text-xs text-muted-foreground">
                      {globalFilter
                        ? `No transactions matching "${globalFilter}".`
                        : "Perform a deposit or withdrawal to begin tracking transaction records."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between gap-4 border-t px-4 py-3 text-xs">
          <p className="text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(1, table.getPageCount())} · {rowCount} total transaction{rowCount === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              className="gap-1 h-8 px-2.5"
            >
              <ChevronLeft className="size-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              className="gap-1 h-8 px-2.5"
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Transaction Modal */}
      <TransactionDialog
        open={txModal.open}
        onOpenChange={(open) => setTxModal((p) => ({ ...p, open }))}
        defaultType={txModal.type}
        accounts={accounts}
        onSuccess={async () => {
          await refetch();
          await loadAllTransactions();
        }}
      />
    </div>
  );
}
