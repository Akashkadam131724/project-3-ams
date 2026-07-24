#!/bin/bash

set -e

echo "=================================="
echo "Deploying Backend..."
echo "=================================="

cd "$(dirname "$0")/server"

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Restarting PM2..."
pm2 restart ams-api

echo "Checking PM2 status..."
pm2 list

echo "Deployment Successful!"
