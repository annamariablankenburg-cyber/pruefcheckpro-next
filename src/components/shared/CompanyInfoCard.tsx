import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CompanyInfo } from "@/types/company";

interface CompanyInfoCardProps {
  info: CompanyInfo;
}

export function CompanyInfoCard({ info }: CompanyInfoCardProps) {
  const items: { label: string; value: string }[] = [
    { label: "Firmenname", value: info.name },
    { label: "Rechtsform", value: info.legalForm },
    { label: "USt-ID", value: info.vatId },
    { label: "Handelsregister", value: info.registryNumber },
    { label: "Website", value: info.website },
    { label: "Telefonnummer", value: info.phone },
    { label: "Support-Mail", value: info.supportEmail },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Unternehmensinformationen</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-medium text-foreground">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
