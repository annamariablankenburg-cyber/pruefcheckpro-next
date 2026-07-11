import { Camera, Image as ImageIcon, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SitePhoto } from "@/types/siteMode";

interface SitePhotoGalleryProps {
  photos: SitePhoto[];
  onToggleFavorite: (photo: SitePhoto) => void;
  onDescriptionChange: (photo: SitePhoto, description: string) => void;
  onDelete: (photo: SitePhoto) => void;
  onAdd: () => void;
}

// Fotos werden heute nur lokal gehalten. Ohne echten Kamerazugriff im
// Browser stehen farbige Platzhalterflächen stellvertretend für Vorschaubilder.
export function SitePhotoGallery({
  photos,
  onToggleFavorite,
  onDescriptionChange,
  onDelete,
  onAdd,
}: SitePhotoGalleryProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Fotos</h2>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Camera className="size-3.5" />
          Foto aufnehmen
        </Button>
      </div>

      {photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <ImageIcon className="size-6 text-muted-foreground/60" />
            Noch keine Fotos aufgenommen.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden py-0">
              <div className={cn("relative flex h-36 items-center justify-center", photo.colorClass)}>
                <ImageIcon className="size-8 text-foreground/30" />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  aria-label={photo.favorite ? `${photo.description} als Favorit entfernen` : `${photo.description} als Favorit markieren`}
                  onClick={() => onToggleFavorite(photo)}
                  className="absolute top-2 right-2 rounded-full shadow-sm"
                >
                  <Star className={cn("size-4", photo.favorite && "fill-warning text-warning")} />
                </Button>
              </div>
              <CardContent className="flex flex-col gap-2 pt-3 pb-4">
                <label htmlFor={`photo-desc-${photo.id}`} className="sr-only">
                  Beschreibung für Foto vom {photo.capturedAt}
                </label>
                <Input
                  id={`photo-desc-${photo.id}`}
                  value={photo.description}
                  onChange={(event) => onDescriptionChange(photo, event.target.value)}
                  placeholder="Beschreibung hinzufügen …"
                  className="h-8 text-sm"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{photo.capturedAt}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Foto vom ${photo.capturedAt} löschen`}
                    onClick={() => onDelete(photo)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
