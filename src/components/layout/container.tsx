import * as React from "react"
import { cn } from "cn"

// Below `lg` the side padding is never smaller than the screen's safe area:
// the page uses viewport-fit=cover (app/layout.tsx), so a phone held sideways
// lets it run under the notch and the rounded corners, and
// env(safe-area-inset-left/right) is how far. Everywhere else those insets are
// 0 and the padding is the plain 16/24px it always was; from `lg` up it is 32px.
function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1280px] pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] lg:px-8",
        className
      )}
      {...props}
    />
  )
}

export { Container }
