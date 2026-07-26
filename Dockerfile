FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy backend server
COPY backend/server.js .

# Copy frontend
COPY frontend ./frontend

EXPOSE 3000

CMD ["node", "server.js"]
