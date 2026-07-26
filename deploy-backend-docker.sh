#!/bin/bash

set -e

echo "=================================="
echo "Deploying Backend..."
echo "=================================="

cd "$(dirname "$0")/server"

echo "Pulling latest code..."
git pull origin main

echo "Pulling latest Docker image..."
docker compose pull

echo "Restarting containers..."
docker compose up -d

echo "Cleaning old images..."
docker image prune -f

docker compose ps

echo "=================================="
echo "Deployment Successful!"
echo "=================================="