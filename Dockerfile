# One image: FastAPI serves the API and the built React app.

FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
WORKDIR /srv
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev
COPY backend/app ./app
COPY --from=web /web/dist ./static
EXPOSE 8080
CMD [".venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
