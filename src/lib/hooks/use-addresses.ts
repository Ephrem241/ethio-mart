"use client"

import { useRemote, type Remote } from "@/lib/hooks/use-remote"
import { fetchMyAddresses, type AddressRecord } from "@/lib/services/addresses"

const loadMyAddresses = (userId: string) => fetchMyAddresses(userId)

export function useMyAddresses(userId: string | undefined): Remote<AddressRecord[]> {
  return useRemote(userId ?? null, loadMyAddresses)
}
