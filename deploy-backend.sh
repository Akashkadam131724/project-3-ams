#!/bin/bash

set -e

echo "Deploying backend..."

cd server

echo "Current branch:"
git branch --show-current

echo "Pulling latest code..."
git pull

echo "Installing packages..."
npm install

echo "Restarting application..."
pm2 restart ams-api

echo "PM2 Status:"
pm2 list

echo "Deployment complete!"
