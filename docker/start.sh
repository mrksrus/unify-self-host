#!/bin/sh
set -e

echo "⏳ Waiting 120 seconds for MySQL to be ready…"
sleep 120

echo "✓ Starting Node.js API server..."
# Start the Node.js API server in the background
node /app/api/server.js &
API_PID=$!

# Give API a moment to start
sleep 2

# Check if API process is still running
if ! kill -0 $API_PID 2>/dev/null; then
  echo "✗ API server failed to start!"
  exit 1
fi

echo "✓ Starting Nginx..."
# Test nginx configuration
if ! nginx -t; then
  echo "✗ Nginx configuration test failed!"
  exit 1
fi

# Start Nginx in the foreground (keeps container alive)
echo "✓ All services started. Container is ready."
exec nginx -g 'daemon off;'
