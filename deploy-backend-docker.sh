#!/bin/bash

set -e

echo "=================================="
echo "Deploying Backend (Docker)..."
echo "=================================="

cd "$(dirname "$0")/server"

echo "Pulling latest code..."
git pull origin main

echo "Building and starting containers..."
docker compose up -d --build

echo "Removing unused Docker images..."
docker image prune -f

echo "Running containers:"
docker compose ps

echo "=================================="
echo "Docker Deployment Successful!"
echo "=================================="
