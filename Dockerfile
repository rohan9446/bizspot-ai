FROM node:20-slim

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

COPY backend ./backend

# Copy frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && rm -rf node_modules package-lock.json && npm install
RUN cd frontend && npm install @rollup/rollup-linux-x64-gnu

COPY frontend ./frontend

# Build frontend
RUN cd frontend && npx vite build

# Move frontend build to backend's public folder
RUN mkdir -p backend/public && cp -r frontend/dist/* backend/public/

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start backend (serves both API and frontend)
CMD ["node", "backend/server.js"]