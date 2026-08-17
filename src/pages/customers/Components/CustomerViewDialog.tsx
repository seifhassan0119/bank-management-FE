import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { money, shortDate } from "@/lib/formatters";
import {
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Building,
} from "lucide-react";
import type { Customer, Account } from "../schema/types";

interface CustomerViewDialogProps {
  customer: Customer | null;
  accounts: Account[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (customer: Customer) => void;
}

export function CustomerViewDialog({
  customer,
  accounts,
  open,
  onOpenChange,
  onEdit,
}: CustomerViewDialogProps) {
  if (!customer) return null;

  const customerAccounts = accounts.filter(
    (a) => String(a.customerId) === String(customer.id)
  );
  const totalBalance = customerAccounts.reduce(
    (sum, a) => sum + (Number(a.balance) || 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-base font-semibold text-primary">
              {customer.firstName?.[0] || "C"}
              {customer.lastName?.[0] || ""}
            </span>
            <div>
              <DialogTitle className="text-xl">
                {customer.firstName} {customer.lastName}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs">ID: {customer.id} · {customer.nationalId}</span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  KYC Verified
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Contact & Profile Info Grid */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3.5 text-xs">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 truncate">
                <p className="text-muted-foreground text-[10px] uppercase font-semibold">Email</p>
                <p className="font-medium text-foreground truncate">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 truncate">
                <p className="text-muted-foreground text-[10px] uppercase font-semibold">Phone</p>
                <p className="font-medium text-foreground truncate">{customer.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 truncate">
                <p className="text-muted-foreground text-[10px] uppercase font-semibold">Date of Birth</p>
                <p className="font-medium text-foreground">{shortDate(customer.dob || customer.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 truncate">
                <p className="text-muted-foreground text-[10px] uppercase font-semibold">Address</p>
                <p className="font-medium text-foreground">
                  {customer.address || "Main Branch"}
                </p>
              </div>
            </div>
          </div>

          {/* Accounts Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="size-3.5" />
                Linked Bank Accounts ({customerAccounts.length})
              </h4>
              <span className="text-xs font-semibold text-foreground">
                Total: <span className="font-mono text-emerald-600 dark:text-emerald-400">{money(totalBalance)}</span>
              </span>
            </div>

            {customerAccounts.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {customerAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm transition hover:bg-muted/40"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium">{acc.accountNumber}</span>
                        <StatusBadge value={acc.accountType} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Status: {acc.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-foreground">{money(Number(acc.balance) || 0, acc.currency)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{acc.currency}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                No active bank accounts linked to this customer yet.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onEdit && (
            <Button
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(customer);
              }}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
