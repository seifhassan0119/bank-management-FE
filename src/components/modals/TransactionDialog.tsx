import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDownRight, ArrowUpRight, Loader2, DollarSign } from "lucide-react";
import { useBank } from "@/pages/customers/services/customerService";
import { toast } from "@/lib/toast";
import { money } from "@/lib/formatters";
import type { Account } from "@/pages/customers/schema/types";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "DEPOSIT" | "WITHDRAW";
  account?: Account | null;
  accounts?: Account[];
  onSuccess?: () => void;
}

export function TransactionDialog({
  open,
  onOpenChange,
  defaultType = "DEPOSIT",
  account: initialAccount,
  accounts: propAccounts,
  onSuccess,
}: TransactionDialogProps) {
  const { accounts: bankAccounts, deposit, withdraw } = useBank();
  const allAccounts = propAccounts && propAccounts.length > 0 ? propAccounts : bankAccounts;

  const [type, setType] = useState<"DEPOSIT" | "WITHDRAW">(defaultType);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setType(defaultType);
  }, [defaultType, open]);

  useEffect(() => {
    if (initialAccount) {
      setSelectedAccountId(String(initialAccount.id));
    } else if (allAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(String(allAccounts[0].id));
    }
  }, [initialAccount, allAccounts, open]);

  useEffect(() => {
    if (open) {
      setAmount("");
      setDescription("");
      setError("");
    }
  }, [open]);

  const targetAccount = allAccounts.find(
    (a) => String(a.id) === String(selectedAccountId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }

    if (!selectedAccountId) {
      setError("Please select an account.");
      return;
    }

    if (type === "WITHDRAW" && targetAccount) {
      const currentBal = parseFloat(String(targetAccount.balance)) || 0;
      if (numAmount > currentBal) {
        setError(
          `Insufficient funds. Current balance is ${money(currentBal)} ${targetAccount.currency || "USD"}.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (type === "DEPOSIT") {
        await deposit({
          accountId: selectedAccountId,
          amount: amount.trim(),
          description: description.trim() || "Deposit",
        });
        toast.success(
          `Successfully deposited ${money(numAmount)} into Account #${targetAccount?.accountNumber || selectedAccountId}`
        );
      } else {
        await withdraw({
          accountId: selectedAccountId,
          amount: amount.trim(),
          description: description.trim() || "Withdrawal",
        });
        toast.success(
          `Successfully withdrew ${money(numAmount)} from Account #${targetAccount?.accountNumber || selectedAccountId}`
        );
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error("Transaction error:", err);
      const backendError =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Transaction failed. Please check the amount and try again.";
      setError(backendError);
      toast.error(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span
                className={`grid size-8 place-items-center rounded-lg ${
                  type === "DEPOSIT"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {type === "DEPOSIT" ? (
                  <ArrowDownRight className="size-4" />
                ) : (
                  <ArrowUpRight className="size-4" />
                )}
              </span>
              <DialogTitle className="text-lg">
                {type === "DEPOSIT" ? "Deposit Funds" : "Withdraw Funds"}
              </DialogTitle>
            </div>
            <DialogDescription>
              {type === "DEPOSIT"
                ? "Credit funds directly to a bank account with instant ledger balance update."
                : "Debit funds from an existing bank account with balance validation."}
            </DialogDescription>
          </DialogHeader>

          {/* Operation Type Switcher */}
          {!initialAccount && (
            <div className="grid grid-cols-2 gap-2 mt-3 p-1 bg-muted/60 rounded-lg">
              <button
                type="button"
                onClick={() => setType("DEPOSIT")}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  type === "DEPOSIT"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Deposit
              </button>
              <button
                type="button"
                onClick={() => setType("WITHDRAW")}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  type === "WITHDRAW"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Withdraw
              </button>
            </div>
          )}

          <div className="space-y-4 py-4">
            {/* Account Selector / Info */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target Bank Account
              </label>
              {initialAccount ? (
                <div className="p-3 bg-muted/50 rounded-lg border flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-foreground">
                      Account #{initialAccount.accountNumber}
                    </p>
                    <p className="text-muted-foreground">
                      {initialAccount.accountType} · {initialAccount.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-foreground">
                      {money(Number(initialAccount.balance) || 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Available Balance
                    </p>
                  </div>
                </div>
              ) : (
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {allAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.accountNumber} ({a.accountType}) — {money(Number(a.balance) || 0)} {a.currency}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <DollarSign className="size-3.5 text-muted-foreground" />
                Amount ({targetAccount?.currency || "USD"})
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono text-sm"
                autoFocus
              />
              {targetAccount && type === "WITHDRAW" && (
                <p className="text-[11px] text-muted-foreground">
                  Max available: {money(Number(targetAccount.balance) || 0)} {targetAccount.currency}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Transaction Note / Description
              </label>
              <Input
                placeholder="e.g. Salary deposit, ATM withdrawal, wire transfer"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`min-w-28 gap-2 cursor-pointer ${
                type === "DEPOSIT"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : type === "DEPOSIT" ? (
                "Confirm Deposit"
              ) : (
                "Confirm Withdrawal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default TransactionDialog;
