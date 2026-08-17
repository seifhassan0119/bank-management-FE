import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Users,
  CreditCard,
  History,
  ArrowRight,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

interface WelcomeSectionProps {
  onAddCustomer?: () => void;
  onOpenAccount?: () => void;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

export const WelcomeSection = ({
  onAddCustomer,
  onOpenAccount,
  onDeposit,
  onWithdraw,
}: WelcomeSectionProps) => {
  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-primary/95 to-slate-900 p-6 text-white shadow-xl lg:p-8">
      {/* Subtle decorative background glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 size-80 rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              {currentDate}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              Counter Active
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {greeting}. The Bank Counter is Open.
          </h1>

          <p className="text-sm leading-relaxed text-slate-200/90">
            Real-time bank counter operations, customer KYC profiles, multi-account liquidity management, and instant ledger tracking across all active portfolios.
          </p>

          {/* Primary Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              asChild
              className="gap-2 bg-white text-slate-950 shadow-md hover:bg-slate-100 cursor-pointer font-semibold"
            >
              <Link to="/customers">
                <Users className="size-4 text-primary" />
                Customers Hub
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="gap-2 border-white/30 bg-white/10 text-white shadow-sm backdrop-blur-md hover:bg-white/20 hover:text-white cursor-pointer"
            >
              <Link to="/accounts">
                <CreditCard className="size-4 text-blue-300" />
                Bank Accounts
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="gap-2 border-white/30 bg-white/10 text-white shadow-sm backdrop-blur-md hover:bg-white/20 hover:text-white cursor-pointer"
            >
              <Link to="/transactions">
                <History className="size-4 text-emerald-300" />
                Transaction Ledger
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Operations Action Panel */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-xl sm:min-w-[260px]">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              onClick={onAddCustomer}
              className="h-8 gap-1.5 bg-white/15 text-xs font-medium text-white hover:bg-white/25 cursor-pointer"
            >
              <Plus className="size-3.5 text-emerald-400" />
              Customer
            </Button>
            <Button
              size="sm"
              onClick={onOpenAccount}
              className="h-8 gap-1.5 bg-white/15 text-xs font-medium text-white hover:bg-white/25 cursor-pointer"
            >
              <Plus className="size-3.5 text-blue-400" />
              Account
            </Button>
            <Button
              size="sm"
              onClick={onDeposit}
              className="h-8 gap-1.5 bg-emerald-500/20 text-xs font-medium text-emerald-200 hover:bg-emerald-500/30 cursor-pointer"
            >
              <ArrowDownRight className="size-3.5 text-emerald-400" />
              Deposit
            </Button>
            <Button
              size="sm"
              onClick={onWithdraw}
              className="h-8 gap-1.5 bg-amber-500/20 text-xs font-medium text-amber-200 hover:bg-amber-500/30 cursor-pointer"
            >
              <ArrowUpRight className="size-3.5 text-amber-400" />
              Withdraw
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;