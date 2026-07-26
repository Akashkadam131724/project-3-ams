#!/bin/bash

set -e

echo "=================================="
echo "Deploying Backend (Docker)..."
echo "=================================="

cd "$(dirname "$0")/server"

echo "Pulling latest code..."
git pull origin main

echo "Building Docker image..."
docker compose build

echo "Starting containers..."
docker compose up -d

echo "Pushing image to Docker Hub..."
docker push akash131/server-api:latest

echo "Removing unused Docker images..."
docker image prune -f

echo "Running containers..."
docker compose ps

echo "=================================="
echo "Docker Deployment Successful!"
echo "=================================="
