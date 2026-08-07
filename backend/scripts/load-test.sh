#!/usr/bin/env bash
#
# Throughput and latency for the public read endpoints.
#
# Fills the one measured gap in docs/quality-model-iso25010.md §2 (Performance Efficiency),
# which was rated Weak precisely because the design reasoning - SSE over polling, targeted
# indexes - had never been verified against numbers.
#
# Two things this deliberately does NOT do:
#
#   * It does not hit write paths. Booking, admission and guest import all mutate real data,
#     and a load test that leaves thousands of phantom bookings behind is worse than no load
#     test. Their concurrency correctness is already proven by the integration suite.
#   * It does not run against a shared or production database. Point API_URL at a local
#     instance backed by a disposable database.
#
# The API rate-limits to RATE_LIMIT_MAX per IP per window (default 100/hour), so the target
# instance must be started with that raised or every run flatlines at 429:
#
#   PORT=4100 RATE_LIMIT_MAX=1000000 RESERVATION_SWEEP_ENABLED=false node server.js &
#   ./scripts/load-test.sh
#
# Usage: [API_URL=…] [CONNECTIONS=20] [DURATION=15] ./scripts/load-test.sh
set -euo pipefail

API_URL="${API_URL:-http://localhost:4100}"
CONNECTIONS="${CONNECTIONS:-20}"
DURATION="${DURATION:-15}"

if ! curl -sf -o /dev/null --max-time 10 "$API_URL/api/v1/events"; then
  echo "Cannot reach $API_URL/api/v1/events - is the API running?" >&2
  exit 1
fi

# A real slug, so the detail endpoint exercises a genuine lookup rather than a 404 path.
SLUG=$(curl -s --max-time 20 "$API_URL/api/v1/events" \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
      const e=JSON.parse(s).data?.event?.[0];
      if(!e){console.error('No events in the database to test against');process.exit(1);}
      console.log(e.slug);
    })")

run () {
  local label="$1" path="$2"
  npx --yes autocannon -c "$CONNECTIONS" -d "$DURATION" -j "$API_URL$path" 2>/dev/null \
    | node -e "
      let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
        const r=JSON.parse(s);
        console.log('$label');
        console.log('  req/sec (mean) :', r.requests.mean.toFixed(1), '  total:', r.requests.total);
        console.log('  latency p50    :', r.latency.p50 + 'ms');
        console.log('  latency p97.5  :', r.latency.p97_5 + 'ms');
        console.log('  latency p99    :', r.latency.p99 + 'ms   max: ' + r.latency.max + 'ms');
        console.log('  non-2xx        :', r.non2xx, '  errors:', r.errors, '  timeouts:', r.timeouts);
        console.log();
      });"
}

echo "Load test - $CONNECTIONS connections, ${DURATION}s each, against $API_URL"
echo
run "GET /api/v1/events        (list)"   "/api/v1/events"
run "GET /api/v1/events/:slug  (detail)" "/api/v1/events/$SLUG"

echo "Note: figures depend heavily on where the database lives. A remote cluster puts"
echo "network round-trips in every request; record which you measured against."
