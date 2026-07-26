#!/bin/bash

set -e

IMAGE_TAG=${IMAGE_TAG:-latest}

echo ""
echo "========================================"
echo "🚀 Starting Deployment"
echo "========================================"
echo "Image Tag : $IMAGE_TAG"
echo ""

cd "$(dirname "$0")/server"

echo "📥 Pulling latest code..."
git pull origin main

echo ""
echo "📦 Pulling Docker image..."
IMAGE_TAG=$IMAGE_TAG docker compose pull

echo ""
echo "🔄 Restarting containers..."
IMAGE_TAG=$IMAGE_TAG docker compose up -d

echo ""
echo "⏳ Waiting for application..."
sleep 5

echo ""
echo "❤️ Running health check..."

if curl --silent --fail http://localhost:3004/health >/tmp/health.json; then

    echo ""
    echo "✅ Health Check Passed"
    cat /tmp/health.json

else

    echo ""
    echo "❌ Health Check Failed"
    echo ""

    echo "Container Status"
    docker compose ps

    echo ""
    echo "Container Logs"
    docker compose logs --tail=100 api

    exit 1
fi

echo ""
echo "🧹 Cleaning unused images..."
docker image prune -f

echo ""
echo "📋 Running Containers"
docker compose ps

echo ""
echo "========================================"
echo "✅ Deployment Successful"
echo "========================================"
echo "Image : akash131/server-api:$IMAGE_TAG"
echo "Health: http://localhost:3004/health"
echo "========================================"