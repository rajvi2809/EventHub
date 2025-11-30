FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production --silent

# Copy application sources
COPY . .

# Create a non-root user and switch to it
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Environment
ENV NODE_ENV=production

# Expose default port used by server.js
EXPOSE 5000

# Start the app
CMD ["node", "server.js"]
