# Use an official Node.js image with yarn pre-installed
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies
RUN yarn config set "strict-ssl" false -g && yarn install --frozen-lockfile

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