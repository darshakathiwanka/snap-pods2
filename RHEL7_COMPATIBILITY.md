# RHEL 7 Compatibility Guide

This guide helps you run SnapPods on RHEL 7 servers with older Docker and docker-compose versions.

## RHEL 7 Compatibility Changes

The project has been updated to work with:
- Docker 1.13.x or newer
- docker-compose 1.x (v1.29.2 is bundled in the container)
- docker-compose.yml version 2.4 format

## Changes Made

1. **docker-compose.yml**: Changed from version 3.8 to 2.4 (compatible with docker-compose 1.x)
2. **Backend Dockerfile**: Installs docker-compose 1.29.2 (compatible with older systems)
3. **Deploy command**: Updated to use shell execution for better compatibility

## Alternative: Use Host's docker-compose

If you prefer to use the host system's docker-compose instead of the one in the container:

### Option 1: Mount docker-compose binary

Modify `docker-compose.yml`:

```yaml
backend:
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - ./projects:/app/projects
    - ./data:/app/data
    - /usr/local/bin/docker-compose:/usr/local/bin/docker-compose:ro  # Add this line
```

### Option 2: Remove docker-compose from Dockerfile

If docker-compose is already on your host and accessible:

1. Remove the docker-compose installation from `backend/Dockerfile`
2. Ensure docker-compose is in the PATH when the container runs
3. The deploy command will use the host's docker-compose

## Verifying Compatibility

Check your docker-compose version:
```bash
docker-compose --version
```

If it's 1.x, you're good to go. The project is configured for compatibility.

## Troubleshooting

### docker-compose command not found in container

If you see errors about docker-compose not being found:
1. Check that the binary was downloaded correctly in the Dockerfile
2. Verify the container has execute permissions: `docker exec snappods-backend ls -la /usr/local/bin/docker-compose`
3. Consider using the host's docker-compose (Option 1 above)

### Version mismatch errors

If you see version-related errors:
- Ensure your project's `docker-compose.yml` files use version 2.x format (not 3.x)
- Example format:
  ```yaml
  version: '2.4'
  services:
    myapp:
      image: nginx
      ports:
        - "8080:80"
  ```

### Old Docker API compatibility

The Python docker library should handle older Docker APIs automatically. If you encounter issues:
- Check Docker version: `docker --version`
- Minimum required: Docker 1.13+
- Update Docker if possible, or report specific API errors

## Building on RHEL 7

```bash
# Make sure you have docker-compose 1.x on the host
docker-compose --version

# Build and start
docker-compose up -d --build
```

## Notes

- The container includes docker-compose 1.29.2 which is compatible with RHEL 7
- All docker-compose.yml files created in projects should use version 2.x format
- The application will work with both docker-compose 1.x and 2.x on the host

