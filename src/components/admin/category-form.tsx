"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { categorySchema, type CategoryValues } from "@/components/admin/category-schema"
import { FormField } from "@/components/forms/form-field"
import { ImageUploadField } from "@/components/admin/image-upload-field"
import { Button } from "@/components/ui/button"

function CategoryForm({
  initialValues,
  onSubmit,
  onCancel,
}: {
  initialValues?: CategoryValues
  onSubmit: (values: CategoryValues) => void
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="category-name_en"
          label="Name (English)"
          registration={register("name_en")}
          error={errors.name_en?.message}
        />
        <FormField
          id="category-name_am"
          label="Name (Amharic)"
          registration={register("name_am")}
          error={errors.name_am?.message}
        />
      </div>
      <FormField
        id="category-slug"
        label="Slug"
        registration={register("slug")}
        error={errors.slug?.message}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="category-description_en"
          label="Description (English)"
          registration={register("description_en")}
          error={errors.description_en?.message}
        />
        <FormField
          id="category-description_am"
          label="Description (Amharic)"
          registration={register("description_am")}
          error={errors.description_am?.message}
        />
      </div>
      <Controller
        name="image_url"
        control={control}
        render={({ field }) => (
          <ImageUploadField
            id="category-image_url"
            label="Category image"
            bucket="categories"
            value={field.value || null}
            onChange={(url) => field.onChange(url ?? "")}
            error={errors.image_url?.message}
          />
        )}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Save category
        </Button>
      </div>
    </form>
  )
}

export { CategoryForm }
