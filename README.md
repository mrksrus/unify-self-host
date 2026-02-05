# UniHub - Self-Hosted Productivity Suite

> **Disclaimer:** This project was entirely AI-generated and built by someone with zero coding experience. It is a learning/hobby project and **must not be used in production without thorough security review and testing**. There will be bugs, security vulnerabilities, incomplete features, and rough edges throughout the codebase. Use at your own risk.

## What is UniHub?

UniHub is a self-hosted, all-in-one productivity hub that combines contacts management, calendar scheduling, and email account management into a single web application. It runs entirely on your own infrastructure using Docker.

## Tech Stack

**Frontend:**

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui components
- TanStack React Query
- Framer Motion animations
- Progressive Web App (PWA) support

**Backend:**

- Node.js with a vanilla HTTP server (no framework)
- MySQL 8.0

**Infrastructure:**

- Docker + Docker Compose
- Nginx (reverse proxy + static file serving)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- No other dependencies needed — everything runs in containers

## Quick Start

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd unify-self-host
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set secure values for:

   - `JWT_SECRET` — a long random string for signing authentication tokens
   - `ENCRYPTION_KEY` — a long random string for encrypting sensitive data (mail credentials)
   - `MYSQL_ROOT_PASSWORD` — MySQL root password
   - `MYSQL_PASSWORD` — MySQL application user password

3. **Start the application:**

   ```bash
   docker compose up -d
   ```

4. **Access UniHub:**

   Open [http://localhost](http://localhost) in your browser.

5. **Default admin credentials:**

   - Email: `admin@unihub.local`
   - Password: `admin123`
   - **Change this password immediately after first login!**

## Environment Variables

| Variable             | Description                              | Required |
| -------------------- | ---------------------------------------- | -------- |
| `JWT_SECRET`         | Secret key for JWT token signing         | Yes      |
| `ENCRYPTION_KEY`     | Key for encrypting mail credentials      | Yes      |
| `MYSQL_HOST`         | MySQL hostname                           | Yes      |
| `MYSQL_PORT`         | MySQL port (default: 3306)               | No       |
| `MYSQL_DATABASE`     | MySQL database name                      | Yes      |
| `MYSQL_USER`         | MySQL username                           | Yes      |
| `MYSQL_PASSWORD`     | MySQL password                           | Yes      |
| `MYSQL_ROOT_PASSWORD`| MySQL root password                      | Yes      |

## Project Structure

```
├── api/
│   ├── server.js          # Backend API server (Node.js)
│   └── package.json       # Backend dependencies
├── src/                   # Frontend React application
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and API client
│   └── pages/             # Page components
├── docker/
│   ├── mysql/             # MySQL config and schema init scripts
│   └── nginx/             # Nginx configuration
├── docker-compose.yml     # Docker Compose orchestration
├── Dockerfile             # Frontend container (Nginx)
├── Dockerfile.api         # API container (Node.js)
└── package.json           # Frontend dependencies
```

## Features

- **Contacts** — create, edit, search, and favorite contacts
- **Calendar** — schedule events with color coding and location support
- **Mail** — email account management (IMAP/SMTP sync is not yet implemented)
- **Admin Panel** — user management for administrators
- **PWA Support** — installable as a native-like app on mobile and desktop
- **Authentication** — JWT-based auth with session management and rate limiting

## Known Limitations & Security Warnings

> **This is an AI-generated project. Read the following carefully before deploying.**

- **No HTTPS by default** — Nginx serves over plain HTTP; place a TLS-terminating reverse proxy (Caddy, Traefik, etc.) in front for production use
- **Mail sync is not functional** — email accounts can be added but IMAP/SMTP sync is not implemented yet
- **Basic input validation** — common cases are handled but edge cases may slip through
- **No CSRF protection** — the API relies solely on JWT Bearer tokens
- **No email verification** — user email addresses are not verified on signup
- **In-memory rate limiting** — rate-limit state is lost when the API container restarts
- **Single-server only** — no clustering or horizontal scaling support
- **No automated backups** — you must back up your MySQL data volume manually
- **Limited error handling** — some error scenarios may return generic 500 errors
- **No audit logging** — user actions are not logged for security auditing
- **Default admin password** — ships with a well-known default; change it immediately

## Development

To run the frontend locally for development:

```bash
# Install frontend dependencies
npm install

# Start the dev server (requires the API + MySQL to be running via Docker)
npm run dev
```

The Vite dev server proxies API requests to `localhost:4000`.

## License

This project is provided as-is with no warranty. Use at your own risk.
