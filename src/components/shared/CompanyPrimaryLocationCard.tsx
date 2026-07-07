import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PrimaryLocation } from "@/types/company";

interface CompanyPrimaryLocationCardProps {
  location: PrimaryLocation;
}

export function CompanyPrimaryLocationCard({ location }: CompanyPrimaryLocationCardProps) {
  const items: { label: string; value: string }[] = [
    { label: "Adresse", value: location.address },
    { label: "Ansprechpartner", value: location.contactPerson },
    { label: "Zeitzone", value: location.timezone },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Primärer Standort</CardTitle>
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
