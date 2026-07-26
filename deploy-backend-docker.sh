#!/bin/bash

set -e

IMAGE_TAG=${IMAGE_TAG:-latest}

echo "=================================="
echo "Deploying Backend..."
echo "Image Tag: $IMAGE_TAG"
echo "=================================="

cd "$(dirname "$0")/server"

echo "Pulling latest code..."
git pull origin main

echo "Pulling Docker image..."
IMAGE_TAG=$IMAGE_TAG docker compose pull

echo "Restarting containers..."
IMAGE_TAG=$IMAGE_TAG docker compose up -d

echo "Cleaning old images..."
docker image prune -f

docker compose ps

echo "=================================="
echo "Deployment Successful!"
echo "Image: akash131/server-api:$IMAGE_TAG"
echo "=================================="