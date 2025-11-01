# Backend Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on your server
- PostgreSQL installed and running locally on the server
- PostgreSQL database created for the application

## Deployment Steps

### 1. Prepare Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database - Use localhost or host.docker.internal to access local PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/badehy
# If using host network mode in docker-compose, use localhost
# If using bridge network, use host.docker.internal

# Server
PORT=4000
NODE_ENV=production

# JWT (if using)
JWT_SECRET=your-secret-key-here

# API URL (for frontend)
NEXT_PUBLIC_API_URL=http://your-domain.com:4000

# Add other environment variables as needed
```

### 2. Build and Run with Docker Compose

```bash
cd backend
docker-compose up -d --build
```

This will:
- Build the Docker image
- Run Prisma migrations
- Start the backend server

**Note:** Make sure PostgreSQL is running on your server before starting the backend container.

### 3. Build and Run Docker Image Only (without docker-compose)

```bash
# Build the image
docker build -t badehy-backend .

# Run the container
docker run -d \
  --name badehy-backend \
  -p 4000:4000 \
  -v $(pwd)/uploads:/app/uploads \
  --env-file .env \
  badehy-backend
```

### 4. View Logs

```bash
# With docker-compose
docker-compose logs -f backend

# Without docker-compose
docker logs -f badehy-backend
```

### 5. Run Prisma Migrations Manually (if needed)

```bash
docker exec -it badehy-backend npx prisma migrate deploy
```

### 6. Access Prisma Studio (for database management)

```bash
docker exec -it badehy-backend npx prisma studio --hostname 0.0.0.0
```

Then access it at `http://localhost:5555` (may need to expose port 5555 if using bridge network)

### 7. Ensure PostgreSQL is Accessible from Docker

If you're using `network_mode: "host"` in docker-compose.yml, the container can access `localhost` PostgreSQL directly.

If you prefer to use bridge network, update the DATABASE_URL to use `host.docker.internal` instead of `localhost`, or use the host's IP address.

## Production Considerations

### 1. Use a Reverse Proxy (Nginx/Traefik)

For production, use a reverse proxy in front of your Docker container:

```nginx
# Nginx example
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Persistent Storage

Ensure the `uploads` directory is mounted as a volume to persist uploaded files:

```yaml
volumes:
  - ./uploads:/app/uploads
```

### 3. Health Checks

The Dockerfile includes a health check. Monitor container health:

```bash
docker ps
# Check STATUS column for "healthy"
```

### 4. Backup Strategy

#### Database Backup
```bash
# PostgreSQL backup (run on host, not in container)
pg_dump -U postgres -h localhost badehy > backup.sql

# Or using docker exec if you have psql in the backend container
docker exec badehy-backend psql $DATABASE_URL -c "\copy (SELECT * FROM your_table) TO '/app/backup.csv' CSV HEADER"
```

#### Uploads Backup
```bash
# Backup uploads directory
tar -czf uploads-backup.tar.gz uploads/
```

### 5. Security

- Use strong passwords for database
- Keep `.env` file secure and never commit it
- Use HTTPS in production (via reverse proxy)
- Regularly update Docker images and dependencies
- Restrict database access to backend container only

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Check if database is accessible
docker exec badehy-backend npx prisma db pull
```

### Migration issues

```bash
# Reset database (WARNING: deletes all data)
docker exec badehy-backend npx prisma migrate reset

# Apply migrations manually
docker exec badehy-backend npx prisma migrate deploy
```

### Port already in use

Change the port in `docker-compose.yml`:
```yaml
ports:
  - "4001:4000"  # Use different host port
```

### Permission issues with uploads

```bash
# Fix permissions
sudo chown -R 1000:1000 uploads/
```

## Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Or rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

