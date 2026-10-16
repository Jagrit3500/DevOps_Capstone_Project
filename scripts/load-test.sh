#!/usr/bin/env bash
# Simple load test using curl — no external tools required
# Usage: bash scripts/load-test.sh [BASE_URL] [REQUESTS]

BASE_URL="${1:-http://localhost:8000}"
REQUESTS="${2:-100}"

echo "=== HireFlow Load Test ==="
echo "Target: $BASE_URL"
echo "Requests: $REQUESTS"
echo ""

for i in $(seq 1 "$REQUESTS"); do
  curl -s -o /dev/null -w "%{http_code} " "$BASE_URL/api/candidates/"
  if (( i % 20 == 0 )); then echo ""; fi
done

echo ""
echo "=== Done ==="
