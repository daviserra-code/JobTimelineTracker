FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (use install instead of ci because we modified package.json manually)
RUN npm install

COPY . .

# Generate migrations
RUN npx drizzle-kit generate

# Build the client and server
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
# Copy shared directory
COPY --from=builder /app/shared ./shared
# Copy migrations folder
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/drizzle.config.ts ./

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Start the application
CMD ["npm", "run", "start"]
