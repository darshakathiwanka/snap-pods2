# SnapPods - Docker Container Management Application

SnapPods is a web-based Docker container management application that allows you to manage Docker containers on your Linux server through an intuitive web interface. Create projects, manage Docker files, deploy containers, monitor stats, and access container terminals - all from your browser.

## Features

- **Project Management**: Create and manage Docker projects with dedicated folders
- **File Manager**: Web-based file editor with syntax highlighting for Dockerfiles, docker-compose.yml, and more
- **Container Management**: View, start, stop, and manage Docker containers
- **One-Click Deployment**: Deploy containers using docker-compose with a single click
- **Live Stats**: Real-time CPU and memory usage monitoring for running containers
- **Container Logs**: View container logs directly in the web interface
- **Terminal Access**: Access container terminals via WebSocket-based terminal emulator
- **Docker Socket Integration**: Direct access to host Docker daemon for full control

## Prerequisites

- Docker and Docker Compose installed on your Linux server
- Ports 80 (frontend) and 8080 (backend) available
- Access to `/var/run/docker.sock` (usually requires root or docker group membership)

## Quick Start

1. **Clone or download the repository**
   ```bash
   cd snap-pods
   ```

2. **Create necessary directories**
   ```bash
   mkdir -p projects data
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Open your browser and navigate to `http://localhost` (or `http://your-server-ip`)
   - The application should be running and ready to use

## Usage

### Creating a Project

1. Click the **"+ New Project"** button in the sidebar
2. Enter a project name (e.g., "my-app")
3. Click **Create**

A new folder will be created in the `projects` directory on your server.

### Managing Files

1. Select a project from the sidebar
2. Click **"+ New File/Folder"** to create files or directories
3. Click on any file to edit it
4. Use the **Save** button to save changes
5. Files are saved directly to the server filesystem

### Deploying Containers

1. Create a `docker-compose.yml` file in your project
2. Optionally create a `Dockerfile` if needed
3. Click the **🚀 Deploy** button
4. The application will run `docker-compose up -d` in your project directory
5. View deployed containers in the Dashboard

### Managing Containers

- **Dashboard**: View all containers with their status
- **Stop/Start**: Click the Stop or Start buttons on container cards
- **Logs**: Click the Logs button to view container logs
- **Terminal**: Click Terminal to access the container shell (for running containers)
- **Stats**: Expand a container card to see live CPU and memory usage charts

## Project Structure

```
snap-pods/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── main.py      # FastAPI application
│   │   ├── models.py    # Database models
│   │   ├── routes/      # API routes
│   │   └── ...
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/            # React TypeScript frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API clients
│   │   └── ...
│   ├── package.json
│   └── Dockerfile
├── projects/            # Your Docker projects (created automatically)
├── data/                # SQLite database (created automatically)
├── docker-compose.yml   # Main deployment file
└── README.md
```

## Configuration

### Environment Variables

Backend environment variables (can be set in `docker-compose.yml`):

- `DATABASE_URL`: SQLite database path (default: `sqlite:///./data/snappods.db`)
- `DOCKER_SOCKET`: Docker socket path (default: `/var/run/docker.sock`)

### Ports

- **Frontend**: Port 80 (HTTP)
- **Backend**: Port 8080 (can be changed in docker-compose.yml)

### Volumes

- `./projects` → Project files storage
- `./data` → SQLite database storage
- `/var/run/docker.sock` → Docker socket access

## Development

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on port 3000 with proxy to backend on port 8080.

## Security Considerations

⚠️ **Important**: SnapPods has full access to your Docker daemon and can execute commands on your host system. 

- **No Authentication**: The application has no built-in authentication (as per requirements)
- **Network Security**: Consider restricting access using firewall rules or reverse proxy with authentication
- **Docker Socket**: Mounting `/var/run/docker.sock` gives full Docker control
- **File Access**: The application can read/write files in the projects directory

**Recommendations**:
- Run SnapPods on a trusted network or behind a VPN
- Use a reverse proxy (nginx, Traefik) with authentication
- Consider adding authentication if exposing to the internet
- Regularly update dependencies for security patches

## Troubleshooting

### Cannot connect to Docker daemon

Ensure the Docker socket is accessible:
```bash
ls -l /var/run/docker.sock
sudo chmod 666 /var/run/docker.sock  # Or add user to docker group
```

### Port already in use

Change ports in `docker-compose.yml`:
```yaml
ports:
  - "8080:8080"  # Change to available port
```

### Permission denied errors

Ensure the `projects` and `data` directories are writable:
```bash
chmod -R 755 projects data
```

### Container stats not showing

- Ensure the container is running
- Check browser console for WebSocket errors
- Verify container ID is correct

## Stopping the Application

```bash
docker-compose down
```

To remove all data (projects and database):
```bash
docker-compose down -v
rm -rf projects data
```

## License

This project is provided as-is for Docker container management.

## Support

For issues or questions, please check the code comments or create an issue in the repository.

