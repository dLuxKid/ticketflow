# TicketFlow Frontend

Event ticketing and discovery platform - Next.js 15 frontend.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack dev server)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v3
- **State**: TanStack Query v5
- **Auth**: JWT via `cookies-next` v6
- **Payments**: Paystack (`react-paystack`)
- **UI**: `sonner` toasts, `react-icons` v5, `react-select`, `react-datepicker`

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:4000
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_key
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (authentication)/ # Login, signup, forgot/reset password
│   ├── (events)/         # Create, edit, explore, my-events
│   ├── (legal)/          # Terms, privacy, refund policy
│   ├── (overview)/       # Home page
│   └── _components/      # Page-level components (FAQ, events sections)
├── components/           # Shared UI components
│   ├── navs/             # Navbar (desktop + mobile)
│   └── ui/               # Buttons, inputs, modals, skeletons
├── assets/               # Static data, images, SVGs
├── hooks/                # Custom React hooks
├── providers/            # TanStack Query + progress bar providers
├── store/                # Global state (Zustand/context)
├── styles/               # Global CSS + react-select styles
├── types/                # TypeScript type declarations
└── utils/                # Actions, queries, cookies, utilities
```

## Deploy

Deployed on Vercel: [https://ticketflow.vercel.app](https://ticketflow.vercel.app)
