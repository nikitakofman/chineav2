# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `npm run dev` - Start the development server at http://localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Run the production build locally
- `npm run lint` - Run ESLint to check code quality

### Installation

- `npm install` - Install all dependencies2

### Database (Prisma)

- `npx prisma generate` - Generate Prisma Client
- `npx prisma db pull` - Pull database schema from Supabase
- `npx prisma db push` - Push schema changes to database
- `npx prisma migrate dev` - Create and apply migrations (development)
- `npx prisma studio` - Open Prisma Studio GUI

## Architecture

This is a Next.js 15.4.2 application using the App Router architecture with TypeScript and Tailwind CSS v4.

### Key Technologies

- **Next.js 15.4.2** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript** - Type safety with strict mode enabled
- **Tailwind CSS v4** - Utility-first CSS framework (latest version using PostCSS plugin)
- **ESLint** - Code linting with Next.js recommended rules
- **Supabase** - Backend as a Service (BaaS) for authentication and database
- **Prisma** - Type-safe ORM for database access
- **shadcn/ui** - Reusable component library built on Radix UI and Tailwind CSS
- **next-themes** - Dark/light mode theme management

### Project Structure

- `src/app/` - App Router pages and layouts
  - `layout.tsx` - Root layout with Geist fonts
  - `page.tsx` - Page components
  - `globals.css` - Global styles and Tailwind imports
- `src/utils/supabase/` - Supabase client utilities
  - `client.ts` - Browser client
  - `server.ts` - Server client for Server Components
- `src/lib/` - Shared utilities
  - `prisma.ts` - Prisma client singleton
  - `utils.ts` - Utility functions (cn for className merging)
- `src/components/ui/` - shadcn/ui components (46 components)
- `src/hooks/` - Custom React hooks
  - `use-mobile.ts` - Mobile detection hook
- `prisma/` - Prisma schema and migrations
- `public/` - Static assets
- Path alias: `@/*` maps to `./src/*`

### Styling Approach

- Tailwind CSS v4 configured via PostCSS (no traditional config file)
- CSS custom properties for theming
- Dark mode support via `prefers-color-scheme` media query
- Geist Sans and Geist Mono fonts from Google Fonts
- shadcn/ui components with customizable styling
- Uses `cn()` utility for conditional className merging

### Database Setup

- **Supabase PostgreSQL** database configured
- **Prisma ORM** for type-safe database access
- Connection pooling via Supabase pooler (pgbouncer)
- Direct connection available for migrations

### Environment Variables

Required environment variables in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase anonymous/publishable key
- `DATABASE_URL` - PostgreSQL connection string (pooled)
- `DIRECT_URL` - PostgreSQL direct connection string

### UI Components (shadcn/ui)

All 46 shadcn/ui components are installed, including:

- Form components: Button, Input, Select, Checkbox, Radio, Switch, etc.
- Layout components: Card, Dialog, Sheet, Tabs, Accordion, etc.
- Navigation: Navigation Menu, Dropdown Menu, Command, etc.
- Feedback: Alert, Toast (Sonner), Progress, Skeleton, etc.
- Data Display: Table, Avatar, Badge, Chart, etc.
- Advanced: Calendar, Carousel, Resizable Panels, etc.

### Important Notes

- Currently no testing framework is configured
- Prisma client generates to default location (node_modules/@prisma/client)
- Both Supabase client and Prisma can be used for database access
- All shadcn/ui components are available in `src/components/ui/`
- Use `npx shadcn@latest add [component]` to update individual components
