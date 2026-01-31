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
| [Redis](https://redis.io/)                                         | Progress caching for fast reads/writes     |
| [Drizzle ORM](https://orm.drizzle.team/)                           | Type-safe database queries                 |
| [NextAuth.js v5](https://authjs.dev/)                              | Authentication                             |
| [Tailwind CSS](https://tailwindcss.com/)                           | Styling                                    |
| [TypeScript](https://www.typescriptlang.org/)                      | Type safety                                |

## Quick Start (Local Development)

Run the app locally in 4 steps:

### Prerequisites

- [Node.js 18.17+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL and Redis)

### Step 1: Clone and Install

```bash
git clone https://github.com/eliasteikari/Freeflix.git
cd Freeflix
npm install
```

### Step 2: Start Docker Services

```bash
docker compose up -d
```

This starts PostgreSQL and Redis in the background. Your data persists even when Docker restarts.

### Step 3: Create `.env.local`

Create a file called `.env.local` in the project root with this content:

```bash
# Database
DATABASE_URL="postgres://freeflix:freeflix@localhost:5432/freeflix"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-random-string-here-for-local-dev"

# Content Source
MYFLIXER_BASE_URL="https://myflixerz.to"
```

### Step 4: Set Up Database and Run

```bash
npm run db:push    # Creates database tables
npm run dev        # Starts the app
```

Open [http://localhost:3000](http://localhost:3000) - you're done!

---

## Stopping and Restarting

| What you want to do | Command |
| --- | --- |
| Stop the app | `Ctrl+C` in the terminal running `npm run dev` |
| Stop Docker services | `docker compose stop` |
| Restart Docker services | `docker compose start` |
| Stop and remove containers (keeps data) | `docker compose down` |
| Stop and delete all data | `docker compose down -v` |

Your watch progress and user data persist across restarts. Only `docker compose down -v` deletes everything.

---

## Troubleshooting

**"Connection refused" errors?**
- Make sure Docker is running: `docker compose ps`
- If containers aren't running: `docker compose up -d`

**Database not working?**
- Reset the database: `docker compose down -v && docker compose up -d && npm run db:push`

**Port already in use?**
- Check if something else is using port 3000, 5432, or 6379
- Stop other services or change ports in `docker-compose.yml`

---

## Detailed Setup

### Environment Variables Explained

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | No | Redis connection string (defaults to `redis://localhost:6379`) |
| `NEXTAUTH_URL` | Yes | Your app URL (use `http://localhost:3000` for local) |
| `NEXTAUTH_SECRET` | Yes | Random string for session encryption |
| `MYFLIXER_BASE_URL` | Yes | Content source URL |

### Docker Services

When you run `docker compose up -d`, these services start:

| Service | Port | Connection String |
| --- | --- | --- |
| PostgreSQL | 5432 | `postgres://freeflix:freeflix@localhost:5432/freeflix` |
| Redis | 6379 | `redis://localhost:6379` |

Both use Docker volumes for persistence - your data survives container restarts.

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
│   ├── redis/            # Redis client & caching
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
- `REDIS_URL` - Redis connection string (optional, falls back to `redis://localhost:6379`)
- `NEXTAUTH_URL` - Your production URL
- `NEXTAUTH_SECRET` - A secure random string
- `MYFLIXER_BASE_URL` - Content source URL

## Architecture

For detailed architecture documentation including database schema, API specifications, and system design, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## License

This project is for educational purposes only.

---

Built with Next.js and deployed on Vercel.
