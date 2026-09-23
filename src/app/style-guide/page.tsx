"use client"

// Temporary dev-only QA route for the Phase 1 design system (spec Section 66).
// Not linked from any navigation. Safe to delete or gate before production.

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { toast } from "sonner"

const swatches: { name: string; className: string; hex: string }[] = [
  { name: "Burgundy", className: "bg-burgundy", hex: "#6E2434" },
  { name: "Burgundy Dark", className: "bg-burgundy-dark", hex: "#511A27" },
  { name: "Ivory", className: "bg-ivory", hex: "#FAF7F2" },
  { name: "Sand", className: "bg-sand", hex: "#E8D9CB" },
  { name: "Charcoal", className: "bg-charcoal", hex: "#292124" },
  { name: "Muted Text", className: "bg-muted-text", hex: "#71696B" },
  { name: "White", className: "bg-white", hex: "#FFFFFF" },
  { name: "Border", className: "bg-[#E7E0DA]", hex: "#E7E0DA" },
  { name: "Success", className: "bg-success", hex: "#267A55" },
  { name: "Warning", className: "bg-warning", hex: "#B7791F" },
  { name: "Error", className: "bg-error", hex: "#B42318" },
]

export default function StyleGuidePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-4 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-charcoal">Design System — Style Guide</h1>
        <p className="text-muted-text">
          Internal QA page for Phase 1. Verifies colors, typography, radii, and base
          components against the brand spec.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-charcoal">Colors</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {swatches.map((s) => (
            <div key={s.name} className="space-y-2">
              <div className={`h-16 rounded-card border border-border ${s.className}`} />
              <div className="text-sm text-charcoal">{s.name}</div>
              <div className="text-xs text-muted-text">{s.hex}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-charcoal">Typography</h2>
        <div className="space-y-3">
          <p className="font-sans text-3xl font-semibold text-charcoal">
            Find something you&apos;ll love.
          </p>
          <p className="font-sans text-base text-charcoal">
            Discover everyday products, special offers, and carefully selected essentials.
          </p>
          <p className="font-amharic text-3xl font-semibold text-charcoal">
            የሚወዱትን ያግኙ።
          </p>
          <p className="font-amharic text-base text-charcoal">ምን ይፈልጋሉ?</p>
          <p className="text-2xl font-semibold text-burgundy">1,850 ETB</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-charcoal">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="outline">Secondary</Button>
          <Button variant="secondary">Filled Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-charcoal">Inputs</h2>
        <div className="max-w-sm space-y-3">
          <Input placeholder="Search products..." />
          <Input placeholder="Invalid field" aria-invalid />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-charcoal">Card</h2>
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Classic Leather Bag</CardTitle>
            <CardDescription>Fashion</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-burgundy">1,850 ETB</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Add to cart</Button>
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-charcoal">Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge className="bg-success text-white">Success</Badge>
          <Badge className="bg-warning text-white">Warning</Badge>
          <Badge className="bg-error text-white">-23%</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-charcoal">Skeleton</h2>
        <div className="max-w-sm space-y-2">
          <Skeleton className="h-40 w-full rounded-image" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-charcoal">Modal, Drawer &amp; Toast</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Modal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Added to your cart</DialogTitle>
                <DialogDescription>
                  Classic Leather Bag has been added to your cart.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button>View cart</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Drawer</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Category, price, availability, rating.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <Button variant="outline" onClick={() => toast("Added to your cart")}>
            Fire Toast
          </Button>
        </div>
      </section>
    </div>
  )
}
