"use client"

import Link from "next/link"
import { User } from "lucide-react"

import { useCurrentUser } from "@/lib/store/auth"
import { Button } from "@/components/ui/button"

function AccountButton() {
  const user = useCurrentUser()

  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href={user ? "/account" : "/login"} aria-label={user ? "Account" : "Sign in"}>
        <User />
      </Link>
    </Button>
  )
}

export { AccountButton }
