#!/bin/sh

# Check TypeScript errors
echo "Checking TypeScript..."
yarn tsc --noEmit

if [ $? -ne 0 ]; then
    echo "TypeScript check failed! Please fix the type errors"
    exit 1
fi

if [ $? -ne 0 ]; then
    echo "Client build failed!"
    exit 1
fi

# Start the server
echo "Starting server..."
exec yarn dev

# Keep the container running
tail -f /dev/null
