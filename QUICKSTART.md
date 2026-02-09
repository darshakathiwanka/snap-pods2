# Quick Start Guide - SnapPods

## Prerequisites

- Docker and Docker Compose installed
- Linux server (or WSL2 on Windows)
- Ports 80 and 8080 available

## Step-by-Step Setup

### 1. Prepare Directories

```bash
mkdir -p projects data
```

### 2. Start the Application

```bash
docker-compose up -d
```

This will:
- Build the backend and frontend containers
- Start both services
- Mount the Docker socket for container management
- Create necessary directories

### 3. Access the Application

Open your browser and go to:
- **http://localhost** (or **http://your-server-ip**)

### 4. Verify It's Working

- You should see the SnapPods dashboard
- The sidebar should show "New Project" button
- If you have existing containers, they should appear in the dashboard

## First Steps

1. **Create a Project**
   - Click "+ New Project" in the sidebar
   - Enter a name (e.g., "test-app")
   - Click "Create"

2. **Create Docker Files**
   - Select your project
   - Click "+ New File/Folder"
   - Create a `docker-compose.yml` file
   - Add your Docker configuration

3. **Deploy**
   - Click the "🚀 Deploy" button
   - Check the dashboard for your running containers

## Troubleshooting

### Port Already in Use

If port 80 is already in use, modify `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Change to available port
```

Then access at `http://localhost:8080`

### Docker Socket Permission Denied

```bash
sudo chmod 666 /var/run/docker.sock
# Or add your user to docker group:
sudo usermod -aG docker $USER
# Then logout and login again
```

### View Logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop the Application

```bash
docker-compose down
```

### Restart After Changes

```bash
docker-compose down
docker-compose up -d --build
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the file manager to create Docker projects
- Deploy containers and monitor them in the dashboard

