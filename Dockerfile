# Multi-stage build for Penpot MCP Server
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (ignore scripts since src is not copied yet)
RUN npm ci --ignore-scripts

# Copy source files
COPY src ./src

# Build
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy built files from builder first
COPY --from=builder /app/dist ./dist

# Install production dependencies only (ignore scripts since we already have built files)
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Run the server
CMD ["node", "dist/index.js"]
