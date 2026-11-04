#!/bin/bash
set -e

echo "=========================================="
echo "Local Penpot MCP Server Test"
echo "=========================================="
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    docker compose -f docker-compose.penpot.yml down -v
    echo "✅ Cleanup complete"
}

# Register cleanup on exit
trap cleanup EXIT

# Step 1: Create test-results directory
echo "📁 Creating test-results directory..."
mkdir -p test-results

# Step 2: Start Penpot stack
echo ""
echo "🚀 Starting Penpot stack..."
docker compose -f docker-compose.penpot.yml up -d
echo "✅ Penpot services started"

# Step 3: Wait for Penpot to be healthy
echo ""
echo "⏳ Waiting for Penpot services to be healthy..."
timeout 300 bash -c '
    while true; do
        BACKEND_HEALTH=$(docker inspect penpot-backend --format="{{.State.Health.Status}}" 2>/dev/null || echo "starting")
        POSTGRES_HEALTH=$(docker inspect penpot-postgres --format="{{.State.Health.Status}}" 2>/dev/null || echo "starting")
        REDIS_HEALTH=$(docker inspect penpot-redis --format="{{.State.Health.Status}}" 2>/dev/null || echo "starting")

        echo "Backend: $BACKEND_HEALTH, Postgres: $POSTGRES_HEALTH, Redis: $REDIS_HEALTH"

        if [ "$POSTGRES_HEALTH" = "healthy" ] && [ "$REDIS_HEALTH" = "healthy" ]; then
            echo "✅ Core services are healthy!"
            break
        fi

        sleep 5
    done
'

# Additional wait for backend to be fully ready
echo ""
echo "⏳ Waiting for backend to be fully ready..."
timeout 300 bash -c '
    until docker logs penpot-backend 2>&1 | grep -q "welcome to penpot"; do
        echo "Waiting for backend to complete startup..."
        sleep 5
    done
'
echo "✅ All services are ready!"

# Step 4: Show service status
echo ""
echo "📋 Service status:"
docker compose -f docker-compose.penpot.yml ps

# Step 5: Setup test user and generate token
echo ""
echo "👤 Setting up test user and generating access token..."
docker compose -f docker-compose.penpot.yml --profile setup up --abort-on-container-exit penpot-setup

if [ ! -f test-results/access-token.txt ]; then
    echo "❌ Setup failed - no access token generated"
    echo ""
    echo "📋 Setup logs:"
    docker compose -f docker-compose.penpot.yml logs penpot-setup
    exit 1
fi

echo "✅ Test user created and token generated"
echo "Token: $(head -c 20 test-results/access-token.txt)..."

# Step 6: Show setup logs
echo ""
echo "📋 Setup logs:"
docker compose -f docker-compose.penpot.yml logs penpot-setup

# Step 7: Run MCP server tests
echo ""
echo "🧪 Running MCP server tests..."
docker compose -f docker-compose.penpot.yml --profile test up --abort-on-container-exit penpot-mcp-test

TEST_EXIT_CODE=$?
echo "Test exit code: $TEST_EXIT_CODE"

# Step 8: Show test logs
echo ""
echo "📋 Test logs:"
docker compose -f docker-compose.penpot.yml logs penpot-mcp-test

if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ Tests failed"
    exit $TEST_EXIT_CODE
fi

echo ""
echo "✅ All tests passed!"
