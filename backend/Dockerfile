# Use an official Python runtime as a parent image.
# Pinned to 3.11: eventlet's monkey-patching is most reliable here, and the
# psycopg2-binary wheels are well established for this version.
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies (e.g., for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Run as a non-root user.
RUN useradd --create-home --uid 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Documentation only. The real port comes from $PORT, which the hosting
# platform injects (Render defaults to 10000); 5000 is the local fallback.
ENV PORT=5000
EXPOSE 5000

# Apply pending database migrations, then start the server. init_db.py runs
# `alembic upgrade head` (stamping a pre-Alembic database at the baseline
# first), so it is safe on every boot and means a fresh database does not need
# a manual setup step.
#
# -w 1 is mandatory, not a tuning choice: Socket.IO has no message queue
# configured, and each worker would open its own duplicate LISTEN connection.
CMD ["sh", "-c", "python init_db.py && exec gunicorn --worker-class eventlet -w 1 -b 0.0.0.0:${PORT} --timeout 120 --access-logfile - run:app"]
