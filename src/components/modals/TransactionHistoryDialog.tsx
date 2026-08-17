import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownRight, ArrowUpRight, History, Loader2, RefreshCw } from "lucide-react";
import { fetchTransactionHistoryApi } from "@/pages/customers/services/customerService";
import { money, shortDate } from "@/lib/formatters";
import type { Account, Transaction } from "@/pages/customers/schema/types";

interface TransactionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export function TransactionHistoryDialog({
  open,
  onOpenChange,
  account,
}: TransactionHistoryDialogProps) {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadHistory = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const data = await fetchTransactionHistoryApi(account.id);
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && account) {
      loadHistory();
    } else {
      setHistory([]);
    }
  }, [open, account]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <History className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-lg">
                  Transaction Ledger · Account #{account?.accountNumber}
                </DialogTitle>
                <DialogDescription>
                  {account?.accountType} Account · Balance:{" "}
                  <strong className="text-foreground">
                    {money(Number(account?.balance) || 0)} {account?.currency}
                  </strong>
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={loading}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto rounded-lg border mt-3">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance After</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin text-primary" />
                      Loading transaction records...
                    </div>
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    <p className="font-medium text-foreground">No transactions recorded</p>
                    <p className="text-xs">
                      Make a deposit or withdrawal to create the first ledger entry.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                history.map((tx) => {
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
                      <TableCell className={`text-right font-mono font-medium ${
                        isDeposit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {isDeposit ? "+" : "-"}
                        {money(Number(tx.amount) || 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {tx.balanceAfter ? money(Number(tx.balanceAfter)) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-foreground max-w-[180px] truncate">
                        {tx.description || "General transaction"}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default TransactionHistoryDialog;
