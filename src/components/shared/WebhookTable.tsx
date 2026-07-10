import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Webhook } from "@/types/integration";

interface WebhookTableProps {
  webhooks: Webhook[];
  onAdd: () => void;
  onDelete: (webhook: Webhook) => void;
}

export function WebhookTable({ webhooks, onAdd, onDelete }: WebhookTableProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Webhooks</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ereignisse in Echtzeit an externe Systeme senden – heute nur UI-Vorschau.
            </p>
          </div>
          <Button type="button" size="sm" onClick={onAdd}>
            <Plus className="size-4" />
            Webhook hinzufügen
          </Button>
        </div>

        {webhooks.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <th className="px-3.5 py-2.5">URL</th>
                  <th className="px-3.5 py-2.5">Ereignis</th>
                  <th className="px-3.5 py-2.5">Status</th>
                  <th className="px-3.5 py-2.5">Erstellt</th>
                  <th className="px-3.5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {webhooks.map((webhook) => (
                  <tr key={webhook.id} className="border-b border-border last:border-0">
                    <td
                      className="max-w-[220px] truncate px-3.5 py-2.5 font-mono text-xs text-foreground"
                      title={webhook.url}
                    >
                      {webhook.url}
                    </td>
                    <td className="px-3.5 py-2.5 text-muted-foreground">{webhook.event}</td>
                    <td className="px-3.5 py-2.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          webhook.status === "Aktiv"
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {webhook.status}
                      </Badge>
                    </td>
                    <td className="px-3.5 py-2.5 text-muted-foreground">{webhook.createdAt}</td>
                    <td className="px-3.5 py-2.5 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Webhook ${webhook.url} löschen`}
                        onClick={() => onDelete(webhook)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Noch keine Webhooks eingerichtet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
