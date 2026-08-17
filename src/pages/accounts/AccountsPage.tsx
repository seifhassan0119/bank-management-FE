import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  CreditCard,
  Search,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Trash2,
  ExternalLink,
  Wallet,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building,
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
import { useBank } from "@/pages/customers/services/customerService";
import { StatusBadge } from "@/pages/customers/Components/StatusBadge";
import { AccountDialog } from "@/components/modals/AccountDialog";
import { TransactionDialog } from "@/components/modals/TransactionDialog";
import { TransactionHistoryDialog } from "@/components/modals/TransactionHistoryDialog";
import { money } from "@/lib/formatters";
import { toast } from "@/lib/toast";
import type { Account, Customer } from "@/pages/customers/schema/types";

type AccountRow = Account & {
  customer?: Customer;
};

const columnHelper = createColumnHelper<AccountRow>();

export default function AccountsPage() {
  const navigate = useNavigate();
  const { customers, accounts, deleteAccount, refetch, isLoading } = useBank();

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [isOpenAccountOpen, setIsOpenAccountOpen] = useState<boolean>(false);
  const [txModal, setTxModal] = useState<{
    open: boolean;
    type: "DEPOSIT" | "WITHDRAW";
    account: Account | null;
  }>({
    open: false,
    type: "DEPOSIT",
    account: null,
  });
  const [historyAccount, setHistoryAccount] = useState<Account | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Accounts refreshed from database");
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const data = useMemo<AccountRow[]>(() => {
    return accounts
      .map((acc) => {
        const cust = customers.find(
          (c) => String(c.id) === String(acc.customerId)
        );
        return {
          ...acc,
          customer: cust,
        };
      })
      .filter((acc) => {
        if (typeFilter === "ALL") return true;
        return String(acc.accountType).toUpperCase() === typeFilter;
      });
  }, [accounts, customers, typeFilter]);

  // Statistics
  const totalDeposits = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  }, [accounts]);

  const activeCount = useMemo(() => {
    return accounts.filter((a) => String(a.status).toUpperCase() === "ACTIVE").length;
  }, [accounts]);

  const checkingCount = useMemo(() => {
    return accounts.filter((a) => String(a.accountType).toUpperCase() === "CHECKING").length;
  }, [accounts]);

  const savingsCount = useMemo(() => {
    return accounts.filter((a) => String(a.accountType).toUpperCase() === "SAVINGS").length;
  }, [accounts]);

  const columns = useMemo<LegacyColumnDef<AccountRow, any>[]>(
    () => [
      columnHelper.accessor("accountNumber", {
        header: "Account Number",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <CreditCard className="size-4" />
            </span>
            <div>
              <p className="font-mono font-bold text-sm text-foreground">
                #{row.original.accountNumber}
              </p>
              <p className="text-[11px] text-muted-foreground">
                ID: {row.original.id}
              </p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor((row: AccountRow) => row.customer?.firstName || "", {
        id: "customer",
        header: "Account Holder",
        cell: ({ row }) => {
          const cust = row.original.customer;
          if (!cust) {
            return (
              <span className="text-xs text-muted-foreground italic">
                Customer #{row.original.customerId}
              </span>
            );
          }
          return (
            <div>
              <Link
                to={`/customers/${cust.id}`}
                className="font-medium text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
              >
                {cust.firstName} {cust.lastName}
                <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              </Link>
              <p className="text-xs text-muted-foreground">
                {cust.email} · {cust.nationalId}
              </p>
            </div>
          );
        },
      }),
      columnHelper.accessor("accountType", {
        header: "Account Type",
        cell: ({ getValue }) => <StatusBadge value={getValue() as string} />,
      }),
      columnHelper.accessor("balance", {
        header: "Available Balance",
        cell: ({ row }) => (
          <div>
            <p className="font-mono font-bold text-sm text-foreground">
              {money(Number(row.original.balance) || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">
              {row.original.currency || "USD"}
            </p>
          </div>
        ),
        meta: { className: "text-right", headerClassName: "text-right" },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const st = String(getValue() || "ACTIVE").toUpperCase();
          const isActive = st === "ACTIVE";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {st}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Operations",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setTxModal({
                  open: true,
                  type: "DEPOSIT",
                  account: row.original,
                })
              }
              className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 cursor-pointer"
              title="Deposit funds"
            >
              <ArrowDownRight className="size-3.5 mr-1" />
              Deposit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setTxModal({
                  open: true,
                  type: "WITHDRAW",
                  account: row.original,
                })
              }
              className="h-8 px-2 text-xs text-amber-600 hover:text-amber-700 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 cursor-pointer"
              title="Withdraw funds"
            >
              <ArrowUpRight className="size-3.5 mr-1" />
              Withdraw
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setHistoryAccount(row.original)}
              title="View transaction ledger"
            >
              <History className="size-4 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                if (row.original.customerId) {
                  navigate(`/customers/${row.original.customerId}`);
                }
              }}
              title="View Customer Profile"
            >
              <ExternalLink className="size-4 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPendingDeleteId(row.original.id)}
              title="Delete account"
            >
              <Trash2 className="size-4 text-destructive/80 hover:text-destructive" />
            </Button>
          </div>
        ),
        meta: { className: "text-right", headerClassName: "text-right" },
      }),
    ],
    [navigate]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row: { original: AccountRow }, _columnId: string, value: string) => {
      const q = String(value).trim().toLowerCase();
      if (!q) return true;
      const a = row.original;
      const c = a.customer;
      return [
        a.accountNumber,
        a.accountType,
        a.currency,
        a.status,
        c?.firstName,
        c?.lastName,
        c?.email,
        c?.nationalId,
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

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteAccount(pendingDeleteId);
      toast.success("Account deleted successfully");
      await refetch();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to delete account";
      toast.error(msg);
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bank Accounts Hub
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Synchronizing account records..."
              : `Managing ${accounts.length} bank accounts across all registered customers`}
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
            onClick={() => setIsOpenAccountOpen(true)}
            className="gap-1.5 text-xs h-9 shadow-sm cursor-pointer"
          >
            <Plus className="size-3.5" />
            Open New Account
          </Button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border shadow-sm flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Building className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Accounts</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{accounts.length}</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {activeCount} active
            </p>
          </div>
        </Card>

        <Card className="p-4 border shadow-sm flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Wallet className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Liquidity</p>
            <p className="text-xl font-bold font-mono text-foreground mt-0.5">
              {money(totalDeposits)}
            </p>
          </div>
        </Card>

        <Card className="p-4 border shadow-sm flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CreditCard className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Checking Accounts</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{checkingCount}</p>
          </div>
        </Card>

        <Card className="p-4 border shadow-sm flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <CreditCard className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Savings Accounts</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{savingsCount}</p>
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
              placeholder="Search account #, holder, email..."
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Type:</span>
            <div className="flex items-center bg-muted/60 p-1 rounded-lg">
              {["ALL", "CHECKING", "SAVINGS"].map((t) => (
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
                      <CreditCard className="size-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">No accounts found</p>
                    <p className="text-xs text-muted-foreground">
                      {globalFilter
                        ? `No accounts matching "${globalFilter}".`
                        : "Open a new account to get started."}
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
            {Math.max(1, table.getPageCount())} · {rowCount} total account{rowCount === 1 ? "" : "s"}
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
        account={txModal.account}
        accounts={accounts}
        onSuccess={() => refetch()}
      />

      {/* Account Transaction History Dialog */}
      <TransactionHistoryDialog
        open={historyAccount !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryAccount(null);
        }}
        account={historyAccount}
      />

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close / Delete Bank Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Account #{pendingDeleteId}? This will permanently remove the account record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Account</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
