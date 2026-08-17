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
import { CreditCard, Sparkles, Loader2 } from "lucide-react";
import { useBank } from "@/pages/customers/services/customerService";
import { toast } from "@/lib/toast";
import type { Customer, AccountFormData } from "@/pages/customers/schema/types";

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string | number;
  customer?: Customer | null;
  onSuccess?: () => void;
}

export function AccountDialog({
  open,
  onOpenChange,
  customerId: initialCustomerId,
  customer,
  onSuccess,
}: AccountDialogProps) {
  const { customers, createAccount } = useBank();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateAccountNumber = () => {
    return "10" + Math.floor(100000000 + Math.random() * 900000000).toString();
  };

  const [formData, setFormData] = useState<AccountFormData>({
    customerId: initialCustomerId || (customer ? customer.id : ""),
    accountNumber: generateAccountNumber(),
    accountType: "CHECKING",
    balance: "500.00",
    currency: "USD",
    status: "ACTIVE",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFormData({
        customerId: initialCustomerId || (customer ? customer.id : customers[0]?.id || ""),
        accountNumber: generateAccountNumber(),
        accountType: "CHECKING",
        balance: "500.00",
        currency: "USD",
        status: "ACTIVE",
      });
      setErrors({});
    }
  }, [open, initialCustomerId, customer, customers]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.customerId) {
      errs.customerId = "Please select a customer";
    }
    const cleanAcc = formData.accountNumber.replace(/\D/g, "");
    if (!cleanAcc || cleanAcc.length < 8) {
      errs.accountNumber = "Account number must be at least 8 digits";
    }
    const numBal = parseFloat(String(formData.balance));
    if (isNaN(numBal) || numBal < 0) {
      errs.balance = "Starting balance must be 0 or higher";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createAccount(formData);
      toast.success(`Account #${formData.accountNumber} opened successfully!`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error("Create account error:", err);
      const backendError =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to open account. Please check inputs.";
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
              <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="size-4" />
              </span>
              <DialogTitle className="text-lg">Open New Bank Account</DialogTitle>
            </div>
            <DialogDescription>
              Assign a new checking or savings account with initial deposit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Customer Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Account Holder (Customer)
              </label>
              {customer ? (
                <div className="p-2.5 bg-muted/50 rounded-md border text-xs">
                  <p className="font-medium text-foreground">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="text-muted-foreground">
                    ID: {customer.id} · National ID: {customer.nationalId}
                  </p>
                </div>
              ) : (
                <select
                  value={formData.customerId}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, customerId: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} (ID: {c.id} - {c.nationalId})
                    </option>
                  ))}
                </select>
              )}
              {errors.customerId && (
                <p className="text-[11px] text-destructive">{errors.customerId}</p>
              )}
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Account Number
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({
                      ...p,
                      accountNumber: generateAccountNumber(),
                    }))
                  }
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
                >
                  <Sparkles className="size-3" />
                  Generate
                </button>
              </div>
              <Input
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, accountNumber: e.target.value }))
                }
                placeholder="e.g. 1029384756"
                className="font-mono text-sm"
              />
              {errors.accountNumber && (
                <p className="text-[11px] text-destructive">{errors.accountNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Account Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Account Type
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, accountType: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="CHECKING">Checking Account</option>
                  <option value="SAVINGS">Savings Account</option>
                </select>
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, currency: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="EGP">EGP (E£)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Initial Balance */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Opening Deposit
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.balance}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, balance: e.target.value }))
                  }
                  placeholder="0.00"
                  className="font-mono text-sm"
                />
                {errors.balance && (
                  <p className="text-[11px] text-destructive">{errors.balance}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, status: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>
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
            <Button type="submit" disabled={isSubmitting} className="min-w-28 gap-2 cursor-pointer">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Open Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default AccountDialog;
