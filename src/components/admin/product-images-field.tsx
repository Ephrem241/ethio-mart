"use client"

import { useRef, useState } from "react"
import { ArrowLeft, ArrowRight, ImageIcon, ImagePlus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useT } from "@/lib/i18n/provider"
import { MAX_PRODUCT_IMAGES } from "@/lib/services/image-sync"
import { ALLOWED_IMAGE_TYPES, uploadImage } from "@/lib/services/storage"
import { ImagePlaceholder } from "@/components/product/image-placeholder"
import { Button } from "@/components/ui/button"

// The product's photos, main one first: add several at once (each is resized
// in the browser and uploaded to the `products` bucket, as the single-image
// field does), move them earlier or later, or remove them. Like that field,
// nothing is saved until the surrounding form is submitted.
//
// A move keeps keyboard focus on the photo that moved, and a polite live
// region says where it went, so the list can be arranged without a mouse.
function ProductImagesField({
  id,
  value,
  onChange,
  error,
}: {
  id: string
  value: string[]
  onChange: (urls: string[]) => void
  error?: string
}) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const [uploading, setUploading] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const full = value.length >= MAX_PRODUCT_IMAGES

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])]
    // Reset so choosing the same files again still fires onChange.
    event.target.value = ""
    if (files.length === 0) return

    const room = MAX_PRODUCT_IMAGES - value.length
    if (files.length > room) toast.error(t("admin.productForm.photoLimit", { max: MAX_PRODUCT_IMAGES }))

    setUploading(true)
    let current = value
    for (const file of files.slice(0, room)) {
      const result = await uploadImage("products", file)
      if (!result.success) {
        toast.error(result.error)
        continue
      }
      current = [...current, result.url]
      onChange(current)
    }
    setUploading(false)
    if (current.length > value.length) toast.success(t("admin.upload.uploaded"))
  }

  function move(from: number, to: number, button: "earlier" | "later") {
    const next = [...value]
    const [url] = next.splice(from, 1)
    next.splice(to, 0, url)
    onChange(next)
    setAnnouncement(t("admin.productForm.photoMoved", { to: to + 1 }))
    // Follow the photo: the same button at its new place, or the other one
    // once it reaches an end of the list.
    requestAnimationFrame(() => {
      const item = listRef.current?.children[to]
      const wanted = item?.querySelector<HTMLButtonElement>(`[data-move="${button}"]:not(:disabled)`)
      ;(wanted ?? item?.querySelector<HTMLButtonElement>("[data-move]:not(:disabled)"))?.focus()
    })
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index))
    setAnnouncement(t("admin.productForm.photoRemoved"))
    inputRef.current?.parentElement?.querySelector<HTMLButtonElement>("[data-add]")?.focus()
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-charcoal">{t("admin.productForm.images")}</legend>
      <p id={`${id}-hint`} className="text-xs text-muted-text">
        {t("admin.productForm.imagesHint", { max: MAX_PRODUCT_IMAGES })} {t("admin.upload.hint")}
      </p>

      {value.length > 0 && (
        <ol ref={listRef} className="flex flex-wrap gap-3">
          {value.map((url, index) => {
            const n = index + 1
            return (
              <li key={url} className="w-28 space-y-1.5">
                <div className="relative">
                  <ImagePlaceholder
                    seed={url}
                    icon={ImageIcon}
                    label={t("admin.productForm.photo", { n })}
                    imageUrl={url}
                    sizes="112px"
                    className="rounded-lg"
                  />
                  {index === 0 && (
                    <span className="absolute top-1.5 left-1.5 rounded-md bg-forest px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      {t("admin.productForm.mainPhoto")}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    data-move="earlier"
                    disabled={index === 0}
                    aria-label={t("admin.productForm.moveEarlier", { n })}
                    onClick={() => move(index, index - 1, "earlier")}
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    data-move="later"
                    disabled={index === value.length - 1}
                    aria-label={t("admin.productForm.moveLater", { n })}
                    onClick={() => move(index, index + 1, "later")}
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("admin.productForm.removePhoto", { n })}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          multiple
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleFiles}
          aria-label={t("admin.productForm.addPhotos")}
          aria-describedby={`${id}-hint`}
          className="sr-only"
          tabIndex={-1}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-add
          disabled={uploading || full}
          aria-describedby={`${id}-hint`}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {uploading ? t("admin.upload.uploading") : t("admin.productForm.addPhotos")}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {error && <p className="text-xs text-error">{error}</p>}
    </fieldset>
  )
}

export { ProductImagesField }
