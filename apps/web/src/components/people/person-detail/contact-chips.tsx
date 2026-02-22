import { Mail, Phone } from "lucide-react";
import HouseholdTooltip from "@/components/household-tooltip";

interface ContactChipsProps {
  phone: string | null;
  email: string | null;
  isPhoneFromHousehold?: boolean;
  children?: React.ReactNode;
}

export function ContactChips({
  phone,
  email,
  isPhoneFromHousehold,
  children,
}: ContactChipsProps) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      {phone && (
        <a
          className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 text-sm transition-colors hover:bg-muted"
          href={`tel:${phone}`}
        >
          <Phone className="size-3.5 text-muted-foreground" />
          {phone}
          <HouseholdTooltip isFromHousehold={!!isPhoneFromHousehold} />
        </a>
      )}
      {email && (
        <a
          className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1 text-sm transition-colors hover:bg-muted"
          href={`mailto:${email}`}
        >
          <Mail className="size-3.5 text-muted-foreground" />
          {email}
        </a>
      )}
      {children}
    </div>
  );
}
