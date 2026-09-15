# Lamb Daily

Daily crossword app: grid + clues (IPUZ), timer, Check → error count, streaks, and a small leaderboard. Designed to run in Docker on a home Mini PC reachable over Tailscale.

## Stack

- Next.js + TypeScript + Tailwind + shadcn/ui
- `@crosswordxyz/react-crossword` with `useIpuz`
- SQLite (`better-sqlite3`) for users / solves / streaks
- Dated `.ipuz` files in `puzzles/`

## Run locally

```bash
npm install --legacy-peer-deps
npm run dev -- -p 8742 -H 0.0.0.0
```

Open [http://127.0.0.1:8742](http://127.0.0.1:8742).

Optional env:

| Variable | Default | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | *(required in Docker; local dev has a throwaway fallback)* | JWT signing for the 30-day session cookie |
| `DATABASE_PATH` | `./data/crossword.db` | SQLite file location |
| `PUZZLES_DIR` | `./puzzles` | Directory of `YYYY-MM-DD.ipuz` files |

“Today” uses **America/Chicago**. If today’s file is missing, the app serves the latest available puzzle and notes the fallback.

## Docker / Tailscale

On the host that will run the app:

```bash
git clone https://github.com/SentientSamuel/Crossword.git lamb-daily
cd lamb-daily

# Set a long random secret before starting (do not commit this value)
export AUTH_SECRET=...

docker compose up -d --build
```

- Host port **8742** → container port **3000**
- From another Tailscale device: `http://YOUR_TAILSCALE_IP:8742`
- On the host itself: `http://127.0.0.1:8742`
- Named volume `crossword-data` persists SQLite
- `./puzzles` is mounted read-only — drop new dated `.ipuz` files to schedule days

```bash
# Verify from the host
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8742/

# Verify over Tailscale (replace with your node's Tailscale IP)
curl -sS -o /dev/null -w '%{http_code}\n' http://YOUR_TAILSCALE_IP:8742/
```

Useful ops:

```bash
docker compose logs -f web
docker compose restart web
docker compose down                 # keeps SQLite volume
docker compose up -d --build        # rebuild after code/puzzle changes
docker compose down -v              # destructive: also removes SQLite volume
```

## Sample puzzles

Shipped under `puzzles/`:

- `2026-09-13.ipuz` — Sunday Stretch (advanced clues)
- `2026-09-14.ipuz` — Monday Warm-Up
- `2026-09-15.ipuz` — Ink & Ochre

Replace these with Exet / xword-pipeline exports when you start constructing for real.

## Auth & leaderboard

- Register / sign in with username + password
- Session cookie lasts 30 days (remember this device)
- Full correct solve saves time (first finish per day) and updates streak
- Leaderboard: current streaks + fastest times for the puzzle date
