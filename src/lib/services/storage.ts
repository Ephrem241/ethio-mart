import { createClient } from "@/lib/supabase/client"

// Image upload to Supabase Storage (spec Section 37). Only admins can write
// to the `products` / `categories` buckets — enforced by Storage RLS, not by
// this file — and both buckets are public-read so storefront visitors can
// load the images. The buckets themselves also cap size (5MB) and restrict
// MIME types, so these client checks are a friendlier first line, not the
// only one.

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

// Refuse absurd inputs before decoding them into a canvas.
const MAX_INPUT_BYTES = 15 * 1024 * 1024
// Section 37: "do not upload enormous original images unnecessarily".
const MAX_DIMENSION = 1600
const WEBP_QUALITY = 0.85

export type ImageBucket = "products" | "categories"

// Downscales (never upscales) so the longest edge is at most MAX_DIMENSION,
// and re-encodes as WebP. Done in the browser with a canvas — no native
// image library and no paid Storage transformation add-on required.
async function resizeToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Your browser can't process images.")
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY))
  if (!blob) throw new Error("Couldn't process that image.")
  return blob
}

export async function uploadImage(
  bucket: ImageBucket,
  file: File
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { success: false, error: "Use a JPEG, PNG, or WebP image." }
  }
  if (file.size > MAX_INPUT_BYTES) {
    return { success: false, error: "That image is too large. Choose one under 15MB." }
  }

  let blob: Blob
  try {
    blob = await resizeToWebp(file)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Couldn't process that image." }
  }

  // A fresh random name each time: no overwriting, and a stale cached copy
  // of a replaced image can never be served under the new URL.
  const path = `${crypto.randomUUID()}.webp`
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
  })

  if (error) return { success: false, error: error.message }
  return { success: true, url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl }
}
