import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  User,
  Mail,
  Phone,
  ShieldCheck,
  MapPin,
  Calendar,
  Loader2,
  Lock,
} from "lucide-react";
import { useBank } from "../services/customerService";
import { toast } from "@/lib/toast";
import type { Customer, CustomerFormData } from "../schema/types";

interface CustomerDialogProps {
  customer?: Customer | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CustomerDialog({
  customer,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: CustomerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled
    ? setControlledOpen ?? (() => {})
    : setInternalOpen;

  const { createCustomer, updateCustomer } = useBank();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationalId: "",
    dob: "2000-01-01",
    address: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof CustomerFormData, string>>
  >({});

  const isEdit = Boolean(customer);

  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        phone: customer.phone || "",
        nationalId: customer.nationalId || "",
        dob: customer.dob || "2000-01-01",
        address: customer.address || "",
      });
    } else if (!customer && isOpen) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        nationalId: String(Math.floor(1000000000 + Math.random() * 9000000000)),
        dob: "2000-01-01",
        address: "",
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof CustomerFormData, string>> = {};
    if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
      errs.firstName = "First name must be at least 2 characters";
    }
    if (!formData.lastName.trim() || formData.lastName.trim().length < 2) {
      errs.lastName = "Last name must be at least 2 characters";
    }
    if (!formData.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Invalid email address";
    }

    const digitsPhone = formData.phone.replace(/\D/g, "");
    if (!digitsPhone || digitsPhone.length < 10 || digitsPhone.length > 15) {
      errs.phone = "Phone must contain 10 to 15 digits (e.g. 01012345678)";
    }

    const digitsNationalId = formData.nationalId.replace(/\D/g, "");
    if (!digitsNationalId) {
      errs.nationalId = "National ID must contain numbers only";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEdit && customer) {
        await updateCustomer(customer.id, formData);
        toast.success(
          `Customer ${formData.firstName} ${formData.lastName} updated successfully`
        );
      } else {
        await createCustomer(formData);
        toast.success(
          `Customer ${formData.firstName} ${formData.lastName} created successfully`
        );
      }
      setIsOpen(false);
    } catch (err: any) {
      console.error("Customer save error:", err);
      const backendError =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to save customer record. Please check field values.";
      toast.error(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="gap-2 shadow-sm font-medium cursor-pointer">
              <Plus className="size-4" />
              Add Customer
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEdit ? "Edit Customer Record" : "Register New Customer"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? `Editing profile for ${customer?.firstName || ""} ${customer?.lastName || ""} (ID: ${customer?.id})`
                : "Enter customer information to register a new account holder in the system."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-muted-foreground" />
                  First Name
                </label>
                <Input
                  placeholder="e.g. Eleanor"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, firstName: e.target.value }))
                  }
                  className={
                    errors.firstName
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                  }
                />
                {errors.firstName && (
                  <p className="text-[11px] text-destructive">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-muted-foreground" />
                  Last Name
                </label>
                <Input
                  placeholder="e.g. Vance"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, lastName: e.target.value }))
                  }
                  className={
                    errors.lastName
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                  }
                />
                {errors.lastName && (
                  <p className="text-[11px] text-destructive">
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5 text-muted-foreground" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="e.vance@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  className={
                    errors.email
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                  }
                />
                {errors.email && (
                  <p className="text-[11px] text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  Phone Number
                </label>
                <Input
                  placeholder="01012345678"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                  className={
                    errors.phone
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                  }
                />
                {errors.phone && (
                  <p className="text-[11px] text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-muted-foreground" />
                    National ID
                  </span>
                  {isEdit && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-normal">
                      <Lock className="size-3" />
                      Locked
                    </span>
                  )}
                </label>
                <Input
                  placeholder="30001011234567"
                  value={formData.nationalId}
                  disabled={isEdit}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, nationalId: e.target.value }))
                  }
                  className={
                    errors.nationalId
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : isEdit
                      ? "bg-muted/60 text-muted-foreground cursor-not-allowed border-dashed select-none opacity-80"
                      : ""
                  }
                />
                {errors.nationalId && (
                  <p className="text-[11px] text-destructive">
                    {errors.nationalId}
                  </p>
                )}
                {isEdit && (
                  <p className="text-[10px] text-muted-foreground">
                    National ID is permanent and cannot be modified.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, dob: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" />
                Address
              </label>
              <Input
                placeholder="e.g. 123 Main St, Cairo"
                value={formData.address}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-24 gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Customer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default CustomerDialog;
