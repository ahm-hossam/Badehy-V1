# Production-ready Dockerfile for Node.js TypeScript backend

FROM node:20-alpine

WORKDIR /app

# Install system dependencies (OpenSSL required for Prisma/PostgreSQL)
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for ts-node and typescript)
RUN npm ci

# Install Prisma CLI globally
RUN npm install -g prisma@^6.12.0

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy application source code
COPY . .

# Create uploads directories with proper permissions (as root)
RUN mkdir -p uploads/meals uploads/messages uploads/programs uploads/templates uploads/videos uploads/meals/cheat && \
    chown -R node:node uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Switch to non-root user for security
USER node

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run Prisma migrations and start server with ts-node
CMD ["sh", "-c", "npx prisma migrate deploy && ts-node src/server.ts"]

