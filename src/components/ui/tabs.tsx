import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

function Tabs({
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) {
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue)

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  const handleValueChange = React.useCallback((newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
  }, [onValueChange])

  return (
    <TabsContext.Provider value={{ value: selectedValue, onValueChange: handleValueChange }}>
      <div
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      />
    </TabsContext.Provider>
  )
}

const tabsListVariants = cva(
  "inline-flex items-center justify-center rounded-lg p-[3px] text-muted-foreground bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof tabsListVariants>) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, value, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext)
  const isActive = selectedValue === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-active={isActive}
      onClick={() => onValueChange?.(value)}
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, value, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { value: selectedValue } = React.useContext(TabsContext)
  if (selectedValue !== value) return null

  return (
    <div
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
