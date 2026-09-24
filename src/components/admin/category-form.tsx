"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { useT } from "@/lib/i18n/provider"
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
  const t = useT()
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
          label={t("admin.categoryForm.nameEn")}
          registration={register("name_en")}
          error={errors.name_en?.message}
        />
        <FormField
          id="category-name_am"
          label={t("admin.categoryForm.nameAm")}
          registration={register("name_am")}
          error={errors.name_am?.message}
        />
      </div>
      <FormField
        id="category-slug"
        label={t("admin.categoryForm.slug")}
        registration={register("slug")}
        error={errors.slug?.message}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="category-description_en"
          label={t("admin.categoryForm.descriptionEn")}
          registration={register("description_en")}
          error={errors.description_en?.message}
        />
        <FormField
          id="category-description_am"
          label={t("admin.categoryForm.descriptionAm")}
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
            label={t("admin.categoryForm.image")}
            bucket="categories"
            value={field.value || null}
            onChange={(url) => field.onChange(url ?? "")}
            error={errors.image_url?.message}
          />
        )}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {t("admin.categoryForm.save")}
        </Button>
      </div>
    </form>
  )
}

export { CategoryForm }
