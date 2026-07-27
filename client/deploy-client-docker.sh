#!/usr/bin/env bash

set -euo pipefail

IMAGE_TAG="${IMAGE_TAG:-latest}"
CLIENT_PORT="${CLIENT_PORT:-3001}"

cd "$(dirname "$0")"

echo "Deploying akash131/ams-client:$IMAGE_TAG"

IMAGE_TAG="$IMAGE_TAG" docker compose pull
IMAGE_TAG="$IMAGE_TAG" docker compose up -d

sleep 8

if ! curl --silent --fail "http://localhost:${CLIENT_PORT}/login" >/dev/null; then
  docker compose ps
  docker compose logs --tail=100 client
  exit 1
fi

docker image prune -f
docker compose ps

echo "Done. Client: http://localhost:${CLIENT_PORT} (image tag: $IMAGE_TAG)"
