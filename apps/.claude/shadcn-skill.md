# shadcn/ui Skill for Claude Code

You are an expert at building UIs with shadcn/ui. Use this skill for all component work.

## Project Setup
- **Component Library**: Radix UI
- **Framework**: Next.js App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS Variables
- **Components Location**: `src/components/ui/`
- **Config File**: `components.json`

## Your Installed Components
You have these 7 components ready to use:

1. **Button** - Action button with variants (default, secondary, outline, ghost, destructive)
2. **Card** - Container component (Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent)
3. **Input** - Text input field with TypeScript support
4. **Form** - React Hook Form integration with Zod validation
5. **Dialog** - Modal dialog (Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription)
6. **Select** - Dropdown selector (Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel)
7. **Dropdown** - Context menu / dropdown actions (DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuLabel)

## Import Path Pattern
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
```

## Form Patterns (Most Important)
shadcn Form uses React Hook Form + Zod. Always follow this pattern:

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 chars"),
})

type FormValues = z.infer<typeof formSchema>

export function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

## Styling with CSS Variables
All components use your custom CSS variables. They're in `app/globals.css`:
- `--primary` - Your main brand color
- `--secondary` - Secondary color
- `--destructive` - Error/danger color
- `--background` - Page background
- `--foreground` - Text color
- `--muted` - Muted text/disabled states
- `--accent` - Accent color
- `--card` - Card background
- `--popover` - Dropdown/popover background
- `--border` - Border color
- `--ring` - Focus ring color

No need to hardcode colors—use Tailwind classes like `bg-primary`, `text-muted-foreground`, `border-border`.

## Dark Mode
Your preset includes dark mode. Components auto-respond to `prefers-color-scheme` and `dark` class.

## Naming & Organization
- Keep components in `src/components/ui/` (system components)
- Put your feature components in `src/components/` (e.g., `src/components/LoginForm.tsx`)
- Use PascalCase for component names
- Use TypeScript interfaces for props

## Before Using Components
1. Check if it's already in your 7 components above
2. Only use Button, Card, Input, Form, Dialog, Select, Dropdown
3. Import correctly with TypeScript types
4. Don't invent props—check the actual component in `src/components/ui/`

## Common Patterns

### Button with Loading State
```typescript
<Button disabled={isLoading}>
  {isLoading ? "Loading..." : "Submit"}
</Button>
```

### Card Container
```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### Dialog with Form
```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
    </DialogHeader>
    <Form>...</Form>
  </DialogContent>
</Dialog>
```

### Select Dropdown
```typescript
<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Dropdown Menu
```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Do This
✅ Always use TypeScript types for props
✅ Follow React Hook Form + Zod for forms
✅ Use Tailwind classes for spacing/sizing
✅ Use CSS variables for colors
✅ Check `src/components/ui/` for actual component exports
✅ Use the 7 components you have—don't ask for others
✅ Keep components accessible (Radix handles this)

## Don't Do This
❌ Don't invent props that don't exist
❌ Don't use inline `style={{}}` when Tailwind classes work
❌ Don't hardcode colors (use CSS variables)
❌ Don't install extra packages for components you don't have
❌ Don't use components outside your 7 installed ones
❌ Don't forget TypeScript types on function params

## Testing Components Locally
```bash
# Run your dev server
npm run dev
# or
yarn dev

# Then navigate to the page where you used the component
```

---

**Version**: 1.0 - Custom Radix preset with Button, Card, Input, Form, Dialog, Select, Dropdown
**Last Updated**: May 2026
