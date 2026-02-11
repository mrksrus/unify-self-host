#!/bin/sh
set -e

echo "⏳ Waiting for MySQL to be ready (checking health status)..."
# Wait for MySQL healthcheck to pass (max 2 minutes with 5s intervals)
MAX_WAIT=120
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
  # Check if MySQL container is healthy via docker healthcheck
  # This is more efficient than fixed sleep
  if timeout 2 bash -c "echo > /dev/tcp/unihub-mysql/3306" 2>/dev/null; then
    # Test actual MySQL connection
    if MYSQL_PWD="${MYSQL_ROOT_PASSWORD:-CHANGE_ME_root_password}" mysqladmin ping -h unihub-mysql -u root --silent 2>/dev/null; then
      echo "✓ MySQL is ready!"
      break
    fi
  fi
  echo "  Still waiting... (${ELAPSED}s/${MAX_WAIT}s)"
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo "⚠ MySQL took longer than expected, but continuing anyway..."
fi

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
