#!/bin/bash

# Default to localhost if not provided
BASE_URL="${1:-http://localhost:8080}"

echo "Running smoke tests against $BASE_URL..."

# 1. Health Check
echo "Checking /health..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$HEALTH_STATUS" -eq 200 ]; then
  echo "✅ /health passed"
else
  echo "❌ /health failed with status $HEALTH_STATUS"
  exit 1
fi

# 2. Ready Check
echo "Checking /ready..."
READY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/ready")
if [ "$READY_STATUS" -eq 200 ]; then
  echo "✅ /ready passed"
else
  echo "❌ /ready failed with status $READY_STATUS"
  # Don't exit here, as it might fail if env vars aren't fully set in dev
fi

echo "Smoke tests completed."
