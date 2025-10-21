#!/bin/bash
echo "Stopping all containers..."
docker compose down

echo "Removing unused images..."
docker image prune -a -f

echo "Removing unused networks..."
docker network prune -f

echo "Removing build cache..."
docker builder prune -f

echo "Current disk usage:"
docker system df

echo "Cleanup complete! 🎉"