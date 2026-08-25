# Stage 1: Build Frontend (React + Vite)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Final Python App Container
FROM python:3.11-slim
WORKDIR /app

# Prevent Python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend source, sample documents, and built frontend dist
COPY backend/ ./backend/
COPY sample_documents/ ./sample_documents/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8000

# Start FastAPI application
CMD ["python", "backend/main.py"]
