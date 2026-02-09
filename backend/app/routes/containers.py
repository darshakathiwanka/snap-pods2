from fastapi import APIRouter, HTTPException, Response
from typing import List
from ..schemas import ContainerInfo, ContainerStats, DeployRequest
from ..docker_client import docker_client
from ..models import Project, get_db
from sqlalchemy.orm import Session
from fastapi import Depends
import subprocess
import os

router = APIRouter(prefix="/api/containers", tags=["containers"])


@router.get("/", response_model=List[ContainerInfo])
def list_containers(all: bool = True):
    """List all containers"""
    return docker_client.list_containers(all=all)


@router.get("/{container_id}/stats", response_model=ContainerStats)
def get_container_stats(container_id: str):
    """Get container stats"""
    stats = docker_client.get_container_stats(container_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Container not found or stats unavailable")
    return stats


@router.post("/{container_id}/stop")
def stop_container(container_id: str):
    """Stop a container"""
    success = docker_client.stop_container(container_id)
    if not success:
        raise HTTPException(status_code=404, detail="Container not found")
    return {"message": "Container stopped successfully"}


@router.post("/{container_id}/start")
def start_container(container_id: str):
    """Start a container"""
    success = docker_client.start_container(container_id)
    if not success:
        raise HTTPException(status_code=404, detail="Container not found")
    return {"message": "Container started successfully"}


@router.get("/{container_id}/logs")
def get_container_logs(container_id: str, tail: int = 100, follow: bool = False):
    """Get container logs"""
    logs = docker_client.get_container_logs(container_id, tail=tail, follow=follow)
    if logs is None:
        raise HTTPException(status_code=404, detail="Container not found")
    
    # Decode logs if bytes
    if isinstance(logs, bytes):
        logs = logs.decode('utf-8', errors='replace')
    
    return {"logs": logs}


@router.post("/deploy")
def deploy_container(deploy_request: DeployRequest, db: Session = Depends(get_db)):
    """Deploy container using docker-compose"""
    project = db.query(Project).filter(Project.id == deploy_request.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_path = project.path
    
    # Check if docker-compose.yml exists
    compose_file = os.path.join(project_path, "docker-compose.yml")
    if not os.path.exists(compose_file):
        raise HTTPException(status_code=400, detail="docker-compose.yml not found in project")
    
    try:
        # Run docker-compose up -d
        # Use shell=True for better compatibility with older docker-compose versions (RHEL 7)
        # For older docker-compose, we change to the directory and run from there
        cmd = f"cd {project_path} && docker-compose -f docker-compose.yml up -d"
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=project_path,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Deployment failed: {result.stderr}"
            )
        
        return {
            "message": "Deployment started successfully",
            "output": result.stdout
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Deployment timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deployment error: {str(e)}")

