"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, FolderTree, Pencil, Trash2 } from "lucide-react"

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
  const { data: categories, loading: categoriesLoading, reload } = useAdminCategories()
  const { data: products, loading: productsLoading } = useAdminProducts()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (categoriesLoading || productsLoading) return null

  if (!categories || !products) {
    return <p className="text-sm text-error">We couldn&apos;t load categories. Please refresh the page.</p>
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
    toast.success(editingId ? "Category updated." : "Category created.")
    setDialogOpen(false)
    reload()
  }

  async function handleDelete(id: string) {
    const result = await deleteCategory(id)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success("Category removed.")
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
        <Button onClick={openAdd}>Add category</Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={FolderTree} title="No categories yet." action={<Button onClick={openAdd}>Add category</Button>} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Active</TableHead>
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
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => handleMove(category.id, "up")}
                      className="disabled:opacity-30"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={index === sorted.length - 1}
                      onClick={() => handleMove(category.id, "down")}
                      className="disabled:opacity-30"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{category.name_en}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-text">{category.slug}</TableCell>
                <TableCell>{products.filter((p) => p.category_id === category.id).length}</TableCell>
                <TableCell>
                  <Switch
                    checked={category.is_active}
                    onCheckedChange={(checked) => handleToggleActive(category.id, checked)}
                    aria-label="Toggle active"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Edit category" onClick={() => openEdit(category.id)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete category"
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
            <DialogTitle>{editingId ? "Edit category" : "Add category"}</DialogTitle>
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
