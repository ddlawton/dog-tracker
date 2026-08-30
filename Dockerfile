FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production

# Copy backend source files
COPY backend/ ./
COPY shared/ /app/shared/

# Copy built frontend from build stage
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Create logs directory
RUN mkdir -p /app/logs

EXPOSE 3000

CMD ["node", "server.js"]
