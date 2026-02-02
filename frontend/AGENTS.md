# Frontend Development Guidelines

## Architecture Overview

This is a **Next.js 16** application using the App Router with React 19, TypeScript 5, and Tailwind CSS v4.

### Tech Stack
- **Framework**: Next.js 16.1.4 (App Router)
- **React**: 19.2.3 (with Server Components by default)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State**: React Context (minimal), Server-side fetching preferred
- **HTTP**: Auto-generated OpenAPI client + direct fetch

### Directory Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Route groups for layouts
│   ├── api/                # API routes (use sparingly)
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Tailwind + CSS variables
├── components/
│   ├── ui/                 # shadcn/ui components (DO NOT EDIT)
│   ├── layout/             # Layout components
│   ├── canvas/             # Drawing/canvas components
│   └── *.tsx               # Feature components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities + backend client
│   ├── backend/            # AUTO-GENERATED OpenAPI client
│   ├── questions.ts        # Data fetching utilities
│   └── utils.ts            # Helper functions
└── public/                 # Static assets
```

## UI Development Guidelines

### 1. Component Architecture

**Server Components (Default)**
- Use for data fetching, static content, SEO-critical pages
- Can access backend directly (no "use client")
- Cannot use hooks or browser APIs

**Client Components ("use client")**
- Add `"use client"` at top for:
  - Event handlers (onClick, onSubmit)
  - Browser APIs (localStorage, window)
  - React hooks (useState, useEffect)
  - Third-party libraries requiring DOM (tldraw, charts)

**Pattern**: Start as Server Component, add `"use client"` only when needed.

### 2. shadcn/ui Usage

**Installing New Components**
```bash
npx shadcn add <component-name>
```

**Available Components** (40+ pre-installed):
- Layout: `card`, `dialog`, `sheet`, `sidebar`, `tabs`
- Forms: `button`, `input`, `select`, `checkbox`, `radio-group`, `form`
- Data: `table`, `data-table`, `pagination`, `scroll-area`
- Feedback: `toast`, `alert`, `skeleton`, `progress`
- Overlay: `popover`, `tooltip`, `dropdown-menu`, `context-menu`

**DO NOT MODIFY** files in `components/ui/` directly. Override via:
- CSS variables in `globals.css`
- Wrapper components in `components/`
- Tailwind classes when using components

### 3. Styling with Tailwind v4

**Key Changes from v3**
- CSS-first configuration in `globals.css`
- No `tailwind.config.js` needed
- Use `@theme` directive for custom values

**Patterns**
```tsx
// Use built-in utilities
<div className="flex items-center justify-between p-4 bg-background">

// Conditional classes with cn() utility
<div className={cn("base-class", isActive && "active-class", className)}>

// Use CSS variables for theming
<div className="bg-primary text-primary-foreground">
```

**Color Scheme**
- Base: `stone` (warm grays)
- Variables defined in `globals.css`
- Dark mode supported via `next-themes`

### 4. Data Fetching

**Server Components** (Preferred)
```tsx
// lib/questions.ts
export async function getQuestions() {
  const res = await fetch(`${BACKEND_URL}/api/questions`, {
    cache: 'no-store', // or 'force-cache' for static data
  });
  return res.json();
}

// app/page.tsx
export default async function Page() {
  const questions = await getQuestions();
  return <QuestionList questions={questions} />;
}
```

**Client Components**
```tsx
"use client";
import { useEffect, useState } from 'react';
import { getQuestionsClient } from '@/lib/questions';

export function QuestionList() {
  const [questions, setQuestions] = useState([]);
  
  useEffect(() => {
    getQuestionsClient().then(setQuestions);
  }, []);
  
  return <div>{/* render */}</div>;
}
```

**OpenAPI Generated Client**
```tsx
// Use auto-generated client for type safety
import { client } from '@/lib/backend';

const response = await client.POST('/api/questions', {
  body: { title: 'New Question' }
});
```

### 5. Form Handling

**With shadcn Form + React Hook Form**
```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  title: z.string().min(2),
  content: z.string(),
});

export function QuestionForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

## Adding New Features

### Step-by-Step Workflow

1. **Define Types** (if not in OpenAPI spec)
   - Add to `lib/types.ts` or inline with component

2. **Create Data Utilities**
   - Add fetch functions to `lib/questions.ts` or new file
   - Follow Server/Client patterns above

3. **Build Components**
   - Create in `components/` or `app/` directory
   - Use shadcn/ui components first
   - Add `"use client"` only when necessary

4. **Add Route (if needed)**
   - Create `app/(dashboard)/new-feature/page.tsx`
   - Use route groups `(dashboard)` for shared layouts

5. **Add Navigation**
   - Update `components/layout/sidebar.tsx` or relevant nav

### Component Template

```tsx
// components/feature-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FeatureCard({ title, children, className }: FeatureCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
```

## Best Practices

- **Prefer Server Components** - Only use Client Components when necessary
- **Use shadcn/ui** - Don't build custom components if shadcn has it
- **Type everything** - Use TypeScript strictly, no `any`
- **Use `cn()` utility** - For conditional class merging
- **Follow file naming** - PascalCase for components, camelCase for utilities
- **Lazy load heavy components** - Use `next/dynamic` for tldraw, charts
- **Test API integration** - Run `npm run generate-client` after backend changes

## Common Commands

```bash
# Install shadcn component
npx shadcn add button

# Generate OpenAPI client (backend must be running)
npm run generate-client

# Development
npm run dev

# Build
npm run build

# Type checking
npx tsc --noEmit
```


### Client Integration 
hey the java backend is the thing that gives you ORM layer (on top of http api)
always use this pattern of integrating with the backend 
see this file : frontend/lib/backend/sdk.gen.ts

and this is the pattern of integration see that here I am integrating with a listing page for seeing all questions etc
```
try {
    const response = await QuestionController.questionRead({
      client: backendClient,
      query: {
        page: pageNumber as string,
        size: pageSize as string,
      },
    });
    questions = response.data?.data || [];
  } catch (err) {
    if (err instanceof AxiosError) {
      error =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch questions";
    } else {
      error = err instanceof Error ? err.message : "Failed to fetch questions";
    }
  }
```


# Post coding Steps
Always make sure that you do these things in order 
1.  npx prettier --write "**/*.{js,jsx,mjs,cjs,ts,tsx,js}" -- This is used to lint the code 
2. npx tsc --noEmit -- This is used to make sure the code in ts layer is compiling (and fix issues if you see any; this should always pass and dont use Any as types; figure those out meaningfully)
3. npm run build -- This would build the nextjs project and make sure the code compiles down and would be visible similarly in vercel as well
