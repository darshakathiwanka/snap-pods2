from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class ProjectCreate(BaseModel):
    name: str


class ProjectResponse(BaseModel):
    id: int
    name: str
    path: str
    created_at: datetime

    class Config:
        from_attributes = True


class FileCreate(BaseModel):
    path: str
    content: Optional[str] = ""


class FileResponse(BaseModel):
    path: str
    content: str
    is_directory: bool
    size: Optional[int] = None


class FileTreeItem(BaseModel):
    name: str
    path: str
    is_directory: bool
    children: Optional[List["FileTreeItem"]] = None


class ContainerInfo(BaseModel):
    id: str
    name: str
    image: str
    status: str
    created: str
    ports: List[Dict[str, Any]] = []


class ContainerStats(BaseModel):
    container_id: str
    cpu_percent: float
    memory_usage: int
    memory_limit: int
    memory_percent: float
    network_rx: int
    network_tx: int


class DeployRequest(BaseModel):
    project_id: int


class LogsRequest(BaseModel):
    container_id: str
    tail: int = 100
    follow: bool = False

