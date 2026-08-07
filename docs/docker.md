# Running TicketFlow with Docker Compose

For local development and recording the demo video - brings up Mongo (as the single-node
replica set the app's transactions require), the backend, and the frontend with one command.

## Prerequisites

Docker and Docker Compose installed and running. **This repository provides the compose
file and Dockerfiles; actually installing/running Docker is up to whoever runs this** - it
was not installed or run as part of authoring these files.

## Setup

```bash
cp backend/.env.docker.example backend/.env.docker
# edit backend/.env.docker and fill in real values:
#   JWT_SECRET, GMAIL_* (email delivery), CLOUDINARY_* (image upload), PAYSTACK_SECRET_KEY
```

`backend/.env.docker` is gitignored - never commit it with real values filled in.

## Run

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

First boot order: `mongo` starts and reports healthy → `mongo-init` runs `rs.initiate()`
once and exits successfully → `backend` starts (it waits specifically for `mongo-init` to
*succeed*, not just for `mongo` to be up, since transactions need an elected PRIMARY, which
takes a few seconds after `rs.initiate()`) → `frontend` starts.

Stop and remove containers (keeps the `mongo_data` volume, so data persists):
```bash
docker compose down
```

Wipe the database too:
```bash
docker compose down -v
```

## Running the backend test suite against this stack

The compose Mongo is a real single-node replica set, so it's a valid target for the
integration tests that need transactions:

```bash
docker compose up -d mongo mongo-init
cd backend
MONGO_TEST_URI="mongodb://localhost:27017/ticketflow_test?replicaSet=rs0" \
  node --test --test-concurrency=1 "tests/**/*.test.js"
```

## Running the GDPR retention sweep manually

```bash
docker compose exec backend node scripts/gdpr-retention-sweep.js
```

## Notes on the images

- **Backend**: single-stage (`node:22-alpine`, `npm ci --omit=dev`) - there's no build
  step for a plain Express app.
- **Frontend**: three-stage (deps → build → run) so an app-code-only change doesn't
  reinstall dependencies on rebuild. `NEXT_PUBLIC_BASE_URL` is a **build** arg, not just a
  runtime env var - Next.js inlines `NEXT_PUBLIC_*` values into the client bundle at build
  time, so it must be set before `npm run build` runs, not just when the container starts.
