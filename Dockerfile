# Use an official Node.js image with yarn pre-installed
FROM node:20-slim

# Set working directory
WORKDIR /app

# Enable Corepack to manage package manager versions
RUN corepack enable

# Copy package.json and yarn.lock first for caching
COPY package.json yarn.lock* ./

# Install dependencies using the updated immutable flag
RUN yarn install --immutable

# Copy remaining application code
COPY . .

# Expose port
EXPOSE 3100

# We'll use a shell script as entrypoint to run multiple commands
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

# docker build -t ally-test .
# docker run -p 3100:3100 -d ally-test
# docker run -p 3100:3100 -e ENV=development ally-test