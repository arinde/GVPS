import { useId, type ChangeEvent } from "react";
import { Camera, Trash2, UserRound } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { cn } from "cn";

export type PhotoPickerProps = {
  /** The photo to show, as any src an <img> accepts; null shows the empty frame. */
  photoUrl: string | null;
  /** Alt text for the photo, e.g. "Passport photograph of Okafor, Ngozi". */
  alt: string;
  onPick?: (file: File) => void;
  /** Offered only when given, and only while there is a photo. */
  onRemove?: () => void;
  disabled?: boolean;
  /** A caption under the frame while a pick is being prepared or saved. */
  busyLabel?: string;
  error?: string;
  className?: string;
};

/**
 * STITCH-GLOBAL.md: a 120×160 passport frame with "Upload photo" beneath it.
 * Presentational — the file goes to `onPick`; resizing and saving are the
 * container's job. Without `onPick` it only displays.
 */
export function PhotoPicker({
  photoUrl,
  alt,
  onPick,
  onRemove,
  disabled = false,
  busyLabel,
  error,
  className,
}: PhotoPickerProps) {
  const inputId = useId();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Cleared so choosing the same file again still fires a change.
    event.target.value = "";
    if (file) onPick?.(file);
  }

  return (
    <div className={cn("flex w-[120px] flex-col items-center gap-2", className)}>
      <div className="border-input bg-canvas flex h-40 w-[120px] items-center justify-center overflow-hidden rounded-lg border">
        {photoUrl ? (
          // A data URL from our own API or the browser, so next/image adds nothing here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={alt} className="size-full object-cover" />
        ) : (
          <UserRound className="text-muted-foreground size-10" aria-hidden="true" />
        )}
      </div>

      {onPick ? (
        <>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled}
            onChange={handleChange}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "border-input text-foreground hover:bg-zebra focus-within:ring-ring inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border bg-white text-xs font-semibold",
              disabled && "pointer-events-none opacity-40",
            )}
          >
            <Camera className="size-3.5" aria-hidden="true" />
            {photoUrl ? "Change photo" : "Upload photo"}
          </label>
          {photoUrl && onRemove ? (
            <AppButton type="button" variant="ghost" size="small" onClick={onRemove} disabled={disabled}>
              <Trash2 aria-hidden="true" />
              Remove
            </AppButton>
          ) : null}
        </>
      ) : null}

      {busyLabel ? (
        <p className="text-muted-foreground text-center text-xs" role="status">
          {busyLabel}
        </p>
      ) : null}
      {error ? (
        <p className="text-danger-foreground text-center text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
