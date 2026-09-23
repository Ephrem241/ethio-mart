"use client"

import { useState } from "react"
import { MapPinOff, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useRequireAuth } from "@/lib/hooks/use-require-auth"
import { useMyAddresses } from "@/lib/hooks/use-addresses"
import {
  addAddress,
  updateAddress,
  removeAddress,
  setDefaultAddress,
  type AddressRecord,
} from "@/lib/services/addresses"
import type { AddressValues } from "@/components/account/address-schema"
import { AddressForm } from "@/components/account/address-form"
import { EmptyState } from "@/components/feedback/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function toFormValues(address: AddressRecord): AddressValues {
  return {
    fullName: address.full_name,
    phone: address.phone,
    city: address.city,
    subCity: address.sub_city,
    woreda: address.woreda,
    address: address.address,
    notes: address.notes,
  }
}

function AccountAddressesContent() {
  const { user, ready } = useRequireAuth("/login?redirect=/account/addresses")
  const { data: addresses, loading, error, reload } = useMyAddresses(user?.id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (!ready || !user || loading) return null

  if (error || !addresses) {
    return (
      <EmptyState
        icon={MapPinOff}
        title="We couldn't load your addresses."
        description="Please refresh the page and try again."
      />
    )
  }

  function openAdd() {
    setEditingId(null)
    setDialogOpen(true)
  }

  function openEdit(id: string) {
    setEditingId(id)
    setDialogOpen(true)
  }

  async function handleSubmit(values: AddressValues) {
    const input = {
      full_name: values.fullName,
      phone: values.phone,
      city: values.city,
      sub_city: values.subCity,
      woreda: values.woreda,
      address: values.address,
      notes: values.notes,
    }

    const result = editingId
      ? await updateAddress(editingId, input)
      : await addAddress(user!.id, input)

    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(editingId ? "Address updated." : "Address saved.")
    setDialogOpen(false)
    reload()
  }

  async function handleRemove(id: string) {
    const result = await removeAddress(id)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success("Address removed.")
    reload()
  }

  async function handleSetDefault(id: string) {
    const result = await setDefaultAddress(id)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success("Default address updated.")
    reload()
  }

  const editingAddress = editingId ? addresses.find((a) => a.id === editingId) : undefined

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd}>Add address</Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPinOff}
          title="No addresses yet."
          description="Add a delivery address to speed up checkout."
          action={<Button onClick={openAdd}>Add address</Button>}
        />
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => (
            <div key={a.id} className="space-y-2 rounded-card border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="text-sm">
                  <p className="font-medium text-charcoal">
                    {a.full_name} {a.is_default && <Badge className="ml-2 align-middle">Default</Badge>}
                  </p>
                  <p className="text-muted-text">{a.phone}</p>
                  <p className="text-muted-text">
                    {a.address}, {a.woreda}, {a.sub_city}, {a.city}
                  </p>
                  {a.notes && <p className="text-muted-text">Notes: {a.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Edit address" onClick={() => openEdit(a.id)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete address" onClick={() => handleRemove(a.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {!a.is_default && (
                <Button variant="outline" size="sm" onClick={() => handleSetDefault(a.id)}>
                  Set as default
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit address" : "Add address"}</DialogTitle>
          </DialogHeader>
          <AddressForm
            initialValues={editingAddress ? toFormValues(editingAddress) : undefined}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { AccountAddressesContent }
