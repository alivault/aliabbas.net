# aliabbas.dev

Ali Abbas’s design-led full-stack engineering portfolio. The site uses an
editorial, motion-rich visual system to present selected work, technical
capabilities, experience, and field notes.

## Stack

- TanStack Start and React 19
- Vite+ for development, builds, formatting, linting, and type checking
- Tailwind CSS 4
- shadcn/ui `base-nova` components powered by Base UI
- Motion for interaction and page animation
- Convex + Better Auth for article comments
- Sanity for articles and experience data
- Cloudflare Workers, Workers AI, and D1

## Commands

```bash
vp install       # Install dependencies
vp dev           # Start the development server
vp check         # Format, lint, and type-check
vp check --fix   # Fix formatting and lint issues
vp build         # Create a production build
vp preview       # Preview the production build
vp run deploy    # Build and deploy with Wrangler
```

The local development server runs at [http://localhost:3000](http://localhost:3000).

## Chat administration

Stored portfolio-chat conversations are available at `/admin/conversations`.
Access uses the existing Better Auth account system plus the private
`ADMIN_EMAILS` Worker secret:

```bash
vp exec wrangler secret put ADMIN_EMAILS
```

Use a comma-separated list to allow more than one administrator. Apply D1
migrations locally and remotely after adding a migration:

```bash
vp exec wrangler d1 migrations apply ali-chat-conversations --local
vp exec wrangler d1 migrations apply ali-chat-conversations --remote
```
