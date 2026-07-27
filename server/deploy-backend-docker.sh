#!/bin/bash

set -e

IMAGE_TAG=${IMAGE_TAG:-latest}
HEALTH_ENDPOINT="/health"

echo ""
echo "========================================"
echo "🚀 Starting Deployment"
echo "========================================"
echo "Image Tag : $IMAGE_TAG"
echo ""

cd "$(dirname "$0")"

echo "📥 Pulling latest code..."
git pull origin main

# Load environment variables from .env
set -a
source .env
set +a

APP_PORT=${PORT}

echo ""
echo "📦 Pulling Docker image..."
IMAGE_TAG=$IMAGE_TAG docker compose pull

echo ""
echo "🔄 Restarting containers..."
IMAGE_TAG=$IMAGE_TAG docker compose up -d

echo ""
echo "⏳ Waiting for application to start..."
sleep 5

echo ""
echo "❤️ Running health check..."

if HEALTH_RESPONSE=$(curl --silent --fail "http://localhost:${APP_PORT}${HEALTH_ENDPOINT}"); then

    echo ""
    echo "✅ Health Check Passed"
    echo "$HEALTH_RESPONSE"

else

    echo ""
    echo "❌ Health Check Failed"
    echo ""

    echo "📋 Container Status"
    docker compose ps

    echo ""
    echo "📜 Last 100 Container Logs"
    docker compose logs --tail=100 api

    exit 1

fi

echo ""
echo "🧹 Cleaning unused Docker images..."
docker image prune -f

echo ""
echo "📋 Running Containers"
docker compose ps

echo ""
echo "========================================"
echo "✅ Deployment Successful"
echo "========================================"
echo "Image      : akash131/ams-server:$IMAGE_TAG"
echo "Health URL : http://localhost:${APP_PORT}${HEALTH_ENDPOINT}"
echo "========================================"