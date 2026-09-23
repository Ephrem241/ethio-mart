"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { useAdminCategories } from "@/lib/hooks/use-admin-data"
import { createProduct, updateProduct } from "@/lib/services/admin-catalog"
import { productSchema, type ProductValues } from "@/components/admin/product-schema"
import { FormField } from "@/components/forms/form-field"
import { ImageUploadField } from "@/components/admin/image-upload-field"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/data/products"

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function toDefaultValues(product?: Product): ProductValues {
  return {
    name_en: product?.name_en ?? "",
    name_am: product?.name_am ?? "",
    slug: product?.slug ?? "",
    description_en: product?.description_en ?? "",
    description_am: product?.description_am ?? "",
    price: product?.price ?? 0,
    compare_at_price: product?.compare_at_price ?? null,
    stock: product?.stock ?? 0,
    sku: product?.sku ?? "",
    category_id: product?.category_id ?? "",
    image_url: product?.image_url ?? null,
    is_featured: product?.is_featured ?? false,
    is_popular: product?.is_popular ?? false,
    is_active: product?.is_active ?? true,
  }
}

function AdminProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const { data: categories = [] } = useAdminCategories()
  const [slugTouched, setSlugTouched] = useState(!!product)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: toDefaultValues(product),
  })

  function handleNameChange(value: string) {
    if (!slugTouched) {
      setValue("slug", slugify(value))
    }
  }

  async function onSubmit(values: ProductValues) {
    const result = product ? await updateProduct(product.id, values) : await createProduct(values)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(product ? "Product updated." : "Product created.")
    router.push("/admin/products")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="name_en"
          label="Name (English)"
          registration={register("name_en", { onChange: (e) => handleNameChange(e.target.value) })}
          error={errors.name_en?.message}
        />
        <FormField
          id="name_am"
          label="Name (Amharic)"
          registration={register("name_am")}
          error={errors.name_am?.message}
        />
      </div>

      <FormField
        id="slug"
        label="Slug"
        registration={register("slug", { onChange: () => setSlugTouched(true) })}
        error={errors.slug?.message}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="description_en" className="text-sm font-medium text-charcoal">
            Description (English)
          </label>
          <Textarea id="description_en" {...register("description_en")} />
          {errors.description_en && <p className="text-xs text-error">{errors.description_en.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="description_am" className="text-sm font-medium text-charcoal">
            Description (Amharic)
          </label>
          <Textarea id="description_am" {...register("description_am")} />
          {errors.description_am && <p className="text-xs text-error">{errors.description_am.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          id="price"
          label="Price (ETB)"
          type="number"
          registration={register("price", { valueAsNumber: true })}
          error={errors.price?.message}
        />
        <FormField
          id="compare_at_price"
          label="Compare-at price (optional)"
          type="number"
          registration={register("compare_at_price", {
            setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
          })}
          error={errors.compare_at_price?.message}
        />
        <FormField
          id="stock"
          label="Stock"
          type="number"
          registration={register("stock", { valueAsNumber: true })}
          error={errors.stock?.message}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="sku" label="SKU" registration={register("sku")} error={errors.sku?.message} />
        <div className="space-y-1.5">
          <label htmlFor="category_id" className="text-sm font-medium text-charcoal">
            Category
          </label>
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <select
                id="category_id"
                value={field.value}
                onChange={field.onChange}
                aria-invalid={!!errors.category_id}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-charcoal outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.category_id && <p className="text-xs text-error">{errors.category_id.message}</p>}
        </div>
      </div>

      <Controller
        name="image_url"
        control={control}
        render={({ field }) => (
          <ImageUploadField
            id="image_url"
            label="Product image"
            bucket="products"
            value={field.value}
            onChange={field.onChange}
            error={errors.image_url?.message}
          />
        )}
      />

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <Controller name="is_active" control={control} render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )} />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <Controller name="is_featured" control={control} render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <Controller name="is_popular" control={control} render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )} />
          Popular
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  )
}

export { AdminProductForm }
