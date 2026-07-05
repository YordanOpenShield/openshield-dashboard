# OpenShield Dashboard

A Next.js application with Better Auth authentication and PostgreSQL database.

## Features

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Better Auth** for authentication
- **PostgreSQL** database with `pg` driver

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432 with:
- **Database:** `openshield`
- **User:** `openshield`
- **Password:** `openshield`

### 3. Configure environment variables

The `.env.local` file is already configured to work with the Docker PostgreSQL:

```bash
# .env.local
DATABASE_URL=postgresql://openshield:openshield@localhost:5432/openshield
```

### 3. Set up the database

Better Auth will automatically create the necessary tables on first run. Make sure your PostgreSQL database is running and accessible.

### 4. Initialize Database Tables

Better Auth requires database tables. Use the Better Auth CLI:

```bash
# Generate migration files
npx @better-auth/cli@latest generate

# Or apply migrations directly
npx @better-auth/cli@latest migrate
```

Or use the init endpoint:

PowerShell:
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/init-db -Method POST
```

Or Bash/curl:
```bash
curl -X POST http://localhost:3000/api/init-db
```

### 5. (Optional) Create a default user

Default user credentials are configured in `.env.local`:
- `DEFAULT_USER_EMAIL` - The email address (default: admin@example.com)
- `DEFAULT_USER_PASSWORD` - The password (default: password123)
- `DEFAULT_USER_NAME` - The display name (default: Admin User)

After initializing the database, create the default user:

PowerShell:
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/seed -Method POST
```

Or Bash/curl:
```bash
curl -X POST http://localhost:3000/api/seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
├── app/
│   ├── api/auth/[...all]/    # Better Auth API routes
│   ├── dashboard/            # Protected dashboard page
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   ├── layout.tsx            # Root layout with Navbar
│   └── page.tsx              # Home page
├── components/
│   └── navbar.tsx            # Navigation component with auth state
├── lib/
│   ├── auth.ts               # Better Auth server configuration
│   ├── auth-client.ts        # Better Auth client
│   └── db.ts                 # PostgreSQL connection
└── .env.local                # Environment variables
```

## Authentication Flow

1. Users can register at `/register`
2. Users can login at `/login`
3. Protected routes check for session using `auth.api.getSession()`
4. Navbar shows user info when authenticated

## Docker Commands

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# Stop and remove data (start fresh)
docker-compose down -v

# View logs
docker-compose logs -f postgres
```

## Learn More

- [Better Auth Documentation](https://www.better-auth.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
