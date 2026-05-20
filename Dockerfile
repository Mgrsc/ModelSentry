# Build stage
FROM oven/bun:slim AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package.json bun.lock* ./

# Install all dependencies (including dev dependencies for building)
RUN bun install --frozen-lockfile

# Copy source code and build configuration
COPY src/ ./src/
COPY tsconfig.json ./

# Build the application with optimizations
RUN bun build src/server.ts --outdir dist --target bun --minify

# Production stage - minimal runtime image
FROM oven/bun:slim AS production

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Install only production dependencies in a single layer
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production && \
    bun pm cache rm && \
    rm -rf /tmp/* /var/tmp/*

# Copy built application and static assets
COPY --from=builder /app/dist/ ./dist/
COPY src/templates/ ./src/templates/
COPY static/ ./static/
COPY config/ ./config/
COPY resources/ ./resources/
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# Change ownership to non-root user
RUN mkdir -p /data && \
    rm -rf /app/data && \
    ln -s /data /app/data && \
    chown -R appuser:appuser /app /data && \
    chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Simplified health check using built-in bun capabilities
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/api/status').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application directly
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bun", "run", "dist/server.js"]
