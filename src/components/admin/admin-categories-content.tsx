"use client"

import { TableSkeleton } from "@/components/feedback/skeletons"
import { useState } from "react"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, FolderTree, Pencil, Trash2 } from "lucide-react"

import { nameOf } from "@/lib/i18n/content"
import { useT } from "@/lib/i18n/provider"
import { useAdminCategories, useAdminProducts } from "@/lib/hooks/use-admin-data"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryActive,
  moveCategory,
} from "@/lib/services/admin-catalog"
import type { CategoryValues } from "@/components/admin/category-schema"
import { CategoryForm } from "@/components/admin/category-form"
import { EmptyState } from "@/components/feedback/empty-state"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import type { Category } from "@/lib/data/categories"

function toFormValues(category: Category): CategoryValues {
  return {
    name_en: category.name_en,
    name_am: category.name_am,
    slug: category.slug,
    description_en: category.description_en,
    description_am: category.description_am,
    image_url: category.image_url,
  }
}

function AdminCategoriesContent() {
  const t = useT()
  const { data: categories, loading: categoriesLoading, reload } = useAdminCategories()
  const { data: products, loading: productsLoading } = useAdminProducts()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (categoriesLoading || productsLoading) return <TableSkeleton columns={6} />

  if (!categories || !products) {
    return <p className="text-sm text-error">{t("admin.loadFailed.categories")}</p>
  }

  const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order)

  function openAdd() {
    setEditingId(null)
    setDialogOpen(true)
  }

  function openEdit(id: string) {
    setEditingId(id)
    setDialogOpen(true)
  }

  async function handleSubmit(values: CategoryValues) {
    const input = { ...values, image_url: values.image_url ?? "" }
    const result = editingId ? await updateCategory(editingId, input) : await createCategory(input)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(editingId ? t("admin.categories.updated") : t("admin.categories.created"))
    setDialogOpen(false)
    reload()
  }

  async function handleDelete(id: string) {
    const result = await deleteCategory(id)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(t("admin.categories.removed"))
    reload()
  }

  async function handleToggleActive(id: string, next: boolean) {
    const result = await setCategoryActive(id, next)
    if (!result.success) toast.error(result.error)
    reload()
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const result = await moveCategory(id, direction)
    if (!result.success) toast.error(result.error)
    reload()
  }

  const editingCategory = editingId ? categories.find((c) => c.id === editingId) : undefined

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd}>{t("admin.categories.add")}</Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title={t("admin.categories.empty")}
          action={<Button onClick={openAdd}>{t("admin.categories.add")}</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.categories.columns.order")}</TableHead>
              <TableHead>{t("admin.categories.columns.category")}</TableHead>
              <TableHead>{t("admin.categories.columns.slug")}</TableHead>
              <TableHead>{t("admin.categories.columns.products")}</TableHead>
              <TableHead>{t("admin.categories.columns.active")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <button
                      type="button"
                      aria-label={t("admin.categories.moveUp")}
                      disabled={index === 0}
                      onClick={() => handleMove(category.id, "up")}
                      className="disabled:opacity-30"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={t("admin.categories.moveDown")}
                      disabled={index === sorted.length - 1}
                      onClick={() => handleMove(category.id, "down")}
                      className="disabled:opacity-30"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{nameOf(category, t.locale)}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-text">{category.slug}</TableCell>
                <TableCell>{products.filter((p) => p.category_id === category.id).length}</TableCell>
                <TableCell>
                  <Switch
                    checked={category.is_active}
                    onCheckedChange={(checked) => handleToggleActive(category.id, checked)}
                    aria-label={t("admin.categories.toggleActive")}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label={t("admin.categories.edit")} onClick={() => openEdit(category.id)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("admin.categories.delete")}
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t("admin.categories.dialogEdit") : t("admin.categories.dialogAdd")}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            initialValues={editingCategory ? toFormValues(editingCategory) : undefined}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { AdminCategoriesContent }
