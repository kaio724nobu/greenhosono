FROM python:3.11-slim

WORKDIR /app

# Python runtime niceties
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Copy app
COPY . .

# Ensure uploads dir exists at runtime path
RUN mkdir -p assets/uploads

EXPOSE 8000

CMD ["python", "server.py"]

