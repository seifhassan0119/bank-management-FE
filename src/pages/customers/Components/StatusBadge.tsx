import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  value: string;
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const normalized = value.toLowerCase();

  if (normalized.includes("check")) {
    return <Badge variant="info">{value}</Badge>;
  }
  if (normalized.includes("sav")) {
    return <Badge variant="success">{value}</Badge>;
  }
  if (normalized.includes("bus")) {
    return <Badge variant="purple">{value}</Badge>;
  }
  if (normalized.includes("inv")) {
    return <Badge variant="warning">{value}</Badge>;
  }
  if (normalized === "active") {
    return <Badge variant="success">{value}</Badge>;
  }
  if (normalized === "inactive" || normalized === "suspended") {
    return <Badge variant="destructive">{value}</Badge>;
  }

  return <Badge variant="secondary">{value}</Badge>;
}
