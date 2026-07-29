import { ChangeEvent, DragEvent, useEffect, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfilePhotoUploadProps {
  imageUrl?: string;
  name: string;
  onChange: (file: File | null) => void;
  onRemove: () => void;
}

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;

export function ProfilePhotoUpload({ imageUrl, name, onChange, onRemove }: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState(imageUrl);
  const [error, setError] = useState("");

  useEffect(() => {
    setPreview(imageUrl);
  }, [imageUrl]);

  const selectFile = (file?: File) => {
    if (!file) return;
    if (!acceptedTypes.has(file.type)) {
      setError("Use uma imagem JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > maxSize) {
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }

    setError("");
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => selectFile(event.target.files?.[0]);
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    selectFile(event.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-3">
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="group flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/40 p-4 text-center transition-colors hover:border-primary/60 hover:bg-primary/5 focus-within:ring-2 focus-within:ring-ring"
      >
        <input
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInput}
          aria-label="Selecionar foto de perfil"
        />
        {preview ? (
          <img src={preview} alt={`Prévia da foto de ${name}`} className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
          </span>
        )}
        <span className="mt-3 flex items-center gap-2 text-sm font-semibold">
          <UploadCloud className="h-4 w-4 text-primary" aria-hidden="true" />
          {preview ? "Trocar foto" : "Enviar foto"}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WEBP · até 5 MB</span>
      </label>
      {preview && (
        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => {
          setPreview(undefined);
          setError("");
          onChange(null);
          onRemove();
        }}>
          <Trash2 /> Remover foto
        </Button>
      )}
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  );
}
