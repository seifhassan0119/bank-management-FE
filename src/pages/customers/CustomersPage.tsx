import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Eye,
  Pencil,
  Search,
  Trash2,
  ArrowUpDown,
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useBank } from "./services/customerService";
import { StatusBadge } from "./Components/StatusBadge";
import { CustomerDialog } from "./Components/CustomerDialog";
import { money, shortDate } from "@/lib/formatters";
import { toast } from "@/lib/toast";
import type { Customer, Row } from "./schema/types";

const columnHelper = createColumnHelper<Row>();

export default function CustomersPage() {
  const navigate = useNavigate();
  const { customers, accounts, deleteCustomer, refetch, isLoading } = useBank();
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Customer list refreshed from backend");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const data = useMemo<Row[]>(
    () =>
      customers.map((c) => {
        const owned = accounts.filter(
          (a) => String(a.customerId) === String(c.id)
        );
        return {
          ...c,
          totalBalance: owned.reduce(
            (sum, a) => sum + (Number(a.balance) || 0),
            0
          ),
          accountTypes: owned.map((a) => a.accountType),
        };
      }),
    [customers, accounts]
  );

  const columns = useMemo<LegacyColumnDef<Row, any>[]>(
    () => [
      columnHelper.accessor((row: Row) => `${row.firstName} ${row.lastName}`, {
        id: "name",
        header: "Customer",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/customers/${row.original.id}`)}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
              title="View Customer Profile"
            >
              {row.original.firstName?.[0] || "C"}
              {row.original.lastName?.[0] || ""}
            </button>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate(`/customers/${row.original.id}`)}
                className="text-left group cursor-pointer block truncate"
              >
                <p className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                  {row.original.firstName} {row.original.lastName}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  ID: {row.original.id} · National ID: {row.original.nationalId}
                </p>
              </button>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("email", {
        header: "Contact",
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-foreground">{row.original.email}</p>
            <p className="text-xs text-muted-foreground">{row.original.phone}</p>
          </div>
        ),
        meta: { className: "hidden md:table-cell" },
      }),
      columnHelper.accessor("accountTypes", {
        header: "Accounts",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.accountTypes.length ? (
              row.original.accountTypes.map((t: string, i: number) => (
                <StatusBadge key={`${t}-${i}`} value={t} />
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">No accounts</span>
            )}
          </div>
        ),
        meta: { className: "hidden lg:table-cell" },
      }),
      columnHelper.accessor("totalBalance", {
        header: "Total Balance",
        cell: ({ getValue }) => (
          <span className="font-medium font-mono text-foreground">
            {money(getValue() as number)}
          </span>
        ),
        meta: { className: "text-right", headerClassName: "text-right" },
      }),
      columnHelper.accessor("dob", {
        header: "Date of Birth",
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {shortDate(getValue() as string)}
          </span>
        ),
        meta: { className: "hidden sm:table-cell" },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="View customer profile"
              title="View customer profile"
              onClick={() => navigate(`/customers/${row.original.id}`)}
              className="cursor-pointer"
            >
              <Eye className="size-4 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit customer"
              title="Edit customer"
              onClick={() => {
                setEditingCustomer(row.original);
                setIsEditDialogOpen(true);
              }}
              className="cursor-pointer"
            >
              <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete customer"
              title="Delete customer"
              onClick={() => setPendingDelete(row.original.id)}
              className="cursor-pointer"
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
    globalFilterFn: (row: { original: Row }, _columnId: string, value: string) => {
      const q = String(value).trim().toLowerCase();
      if (!q) return true;
      const c = row.original;
      return [c.firstName, c.lastName, c.email, c.phone, c.nationalId, c.address]
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
  const target = customers.find((c) => c.id === pendingDelete);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Customers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? (
              "Synchronizing with backend..."
            ) : (
              `${rowCount} registered customer${rowCount === 1 ? "" : "s"} in bank directory`
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5 text-xs h-9 cursor-pointer"
            title="Refresh from backend"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <CustomerDialog />
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden border shadow-sm">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4 border-b p-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search name, email, phone or national ID..."
              className="pl-9 text-sm"
            />
          </div>
          {globalFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGlobalFilter("")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filter
            </Button>
          )}
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
                      <Users className="size-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">No customers found</p>
                    <p className="text-xs text-muted-foreground">
                      {globalFilter
                        ? `No records matching "${globalFilter}". Try adjusting your search query.`
                        : "No customer records currently available in the backend database."}
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
            {Math.max(1, table.getPageCount())} · {rowCount} total record{rowCount === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              className="gap-1 h-8 px-2.5 cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              className="gap-1 h-8 px-2.5 cursor-pointer"
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer Record?</AlertDialogTitle>
            <AlertDialogDescription>
              {target ? (
                <>
                  Are you sure you want to delete{" "}
                  <strong className="text-foreground">
                    {target.firstName} {target.lastName}
                  </strong>{" "}
                  (<span className="font-mono">{target.nationalId}</span>)? This will
                  permanently remove their profile and linked accounts from the database.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Record</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
              onClick={async () => {
                if (pendingDelete) {
                  const idToDelete = pendingDelete;
                  const targetCustomer = customers.find((c) => c.id === idToDelete);
                  const customerName = targetCustomer
                    ? `${targetCustomer.firstName} ${targetCustomer.lastName}`
                    : "Customer";
                  setPendingDelete(null);

                  try {
                    await deleteCustomer(idToDelete);
                    await refetch();
                    toast.success(`${customerName} deleted successfully`);
                  } catch (err: any) {
                    console.error("Delete customer error:", err);
                    const msg =
                      err.response?.data?.message ||
                      err.response?.data?.error ||
                      err.message ||
                      "Failed to delete customer";
                    toast.error(msg);
                  }
                }
              }}
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Customer Dialog */}
      <CustomerDialog
        customer={editingCustomer}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingCustomer(null);
        }}
      />
    </div>
  );
}
