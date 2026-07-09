import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  message: string;
  onReset?: () => void;
}

// Einheitlicher Empty State für gefilterte/gesuchte Listen und Tabellen.
export function EmptyState({ message, onReset }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        {onReset && (
          <Button type="button" variant="outline" size="sm" onClick={onReset}>
            Filter zurücksetzen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
