"use client"

import { useRef, useState } from "react"
import { ImageIcon } from "lucide-react"
import { toast } from "sonner"

import { ALLOWED_IMAGE_TYPES, uploadImage, type ImageBucket } from "@/lib/services/storage"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { Button } from "@/components/ui/button"

// A real upload control (replaces the earlier plain "Image URL" text field,
// which existed only because no storage backend did). Picking a file resizes
// it in the browser and uploads it to the given bucket; `onChange` receives
// the resulting public URL, or null when removed. The URL is only saved with
// the product/category when the surrounding form is submitted.
function ImageUploadField({
  id,
  label,
  bucket,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  bucket: ImageBucket
  value: string | null
  onChange: (url: string | null) => void
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset so choosing the same file again still fires onChange.
    event.target.value = ""
    if (!file) return

    setUploading(true)
    const result = await uploadImage(bucket, file)
    setUploading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }
    onChange(result.url)
    toast.success("Image uploaded.")
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-charcoal">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <div className="size-20 shrink-0">
          <ImagePlaceholder seed={id} icon={ImageIcon} label={`${label} preview`} imageUrl={value} />
        </div>
        <div className="flex flex-col items-start gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleFile}
            className="sr-only"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading..." : value ? "Replace image" : "Upload image"}
          </Button>
          {value && !uploading && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-text">JPEG, PNG or WebP. Resized automatically before upload.</p>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}

export { ImageUploadField }
