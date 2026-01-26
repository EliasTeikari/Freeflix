# Freeflix

A modern movie streaming platform built with Next.js that allows users to search, watch, and track their viewing progress across movies and series. This was made for educational purposes only!

![alt text](<Screenshot 2026-01-26 at 19.05.39.png>)

## Features

- **Movie Search** - Search for movies and TV series with real-time results
- **Video Streaming** - Stream content with a custom HTML5 video player
- **Watch Progress** - Automatically saves and resumes your viewing position
- **Favorites** - Save movies to your personal favorites list
- **User Authentication** - Secure email/password authentication
- **Ad Filtering** - Built-in content filtering for a cleaner viewing experience
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## Tech Stack

| Technology                                                         | Purpose                                    |
| ------------------------------------------------------------------ | ------------------------------------------ |
| [Next.js 16](https://nextjs.org/)                                  | Full-stack React framework with App Router |
| [React 19](https://react.dev/)                                     | UI library                                 |
| [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) | Database                                   |
| [Drizzle ORM](https://orm.drizzle.team/)                           | Type-safe database queries                 |
| [NextAuth.js v5](https://authjs.dev/)                              | Authentication                             |
| [Tailwind CSS](https://tailwindcss.com/)                           | Styling                                    |
| [TypeScript](https://www.typescriptlang.org/)                      | Type safety                                |

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- PostgreSQL database (local or cloud)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/eliasteikari/Freeflix.git
cd Freeflix
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Configure your `.env.local` file:

```bash
# Database (Vercel Postgres or local)
DATABASE_URL="postgres://user:password@localhost:5432/freeflix"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Content Source
MYFLIXER_BASE_URL="https://myflixerz.to"
```

5. Set up the database:

```bash
npm run db:push
```

6. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Local Database with Docker

For local development, you can use Docker to run PostgreSQL:

```bash
docker compose up -d
```

This starts a PostgreSQL instance with:

- Host: `localhost`
- Port: `5432`
- User: `freeflix`
- Password: `freeflix`
- Database: `freeflix`

Connection string: `postgres://freeflix:freeflix@localhost:5432/freeflix`

## Scripts

| Command               | Description                 |
| --------------------- | --------------------------- |
| `npm run dev`         | Start development server    |
| `npm run build`       | Build for production        |
| `npm run start`       | Start production server     |
| `npm run lint`        | Run ESLint                  |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push`     | Push schema to database     |
| `npm run db:studio`   | Open Drizzle Studio         |

## Project Structure

```
freeflix/
├── app/
│   ├── (auth)/           # Auth pages (login, register)
│   ├── (main)/           # Main app pages
│   │   ├── page.tsx      # Home/Browse
│   │   ├── search/       # Search results
│   │   ├── movie/[id]/   # Movie details & player
│   │   ├── favorites/    # User favorites
│   │   └── continue-watching/
│   └── api/              # API routes
│       ├── auth/         # NextAuth endpoints
│       ├── movies/       # Movie search & streaming
│       ├── progress/     # Watch progress
│       └── favorites/    # Favorites management
├── components/
│   ├── ui/               # Reusable UI components
│   ├── auth/             # Auth forms
│   ├── movie/            # Movie-related components
│   └── layout/           # Layout components
├── lib/
│   ├── db/               # Database connection & schema
│   ├── auth/             # NextAuth configuration
│   ├── services/         # External service integrations
│   └── utils/            # Utility functions
├── hooks/                # React hooks
└── types/                # TypeScript type definitions
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard
4. Deploy

### Environment Variables for Production

Required environment variables for deployment:

- `DATABASE_URL` or `POSTGRES_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your production URL
- `NEXTAUTH_SECRET` - A secure random string
- `MYFLIXER_BASE_URL` - Content source URL

## Architecture

For detailed architecture documentation including database schema, API specifications, and system design, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## License

This project is for educational purposes only.

---

Built with Next.js and deployed on Vercel.
