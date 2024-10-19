#!/bin/sh

# Build the client
exec yarn build:client

# Start the server
exec yarn dev:server