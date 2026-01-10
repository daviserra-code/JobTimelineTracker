#!/bin/bash

# Stop execution on error
set -e

echo "Starting deployment..."

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Rebuild and restart containers
echo "Rebuilding containers..."
docker-compose -f docker-compose.yml up -d --build

# Run migrations (handled in Dockerfile, but good to be explicit or if needing manual run)
# echo "Running migrations..."
# docker-compose exec app npm run db:push

echo "Deployment successful!"
