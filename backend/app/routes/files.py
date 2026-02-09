from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..models import get_db, Project
from ..schemas import FileCreate, FileResponse, FileTreeItem
from ..file_manager import file_manager

router = APIRouter(prefix="/api/files", tags=["files"])


def get_project_by_id(db: Session, project_id: int) -> Project:
    """Helper to get project and verify it exists"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/project/{project_id}/tree", response_model=List[FileTreeItem])
def list_files(project_id: int, subpath: str = "", db: Session = Depends(get_db)):
    """List files in a project"""
    project = get_project_by_id(db, project_id)
    return file_manager.list_files(project.name, subpath)


@router.get("/project/{project_id}/read")
def read_file(project_id: int, file_path: str, db: Session = Depends(get_db)):
    """Read a file"""
    project = get_project_by_id(db, project_id)
    content = file_manager.read_file(project.name, file_path)
    if content is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_info = file_manager.get_file_info(project.name, file_path)
    return {
        "path": file_path,
        "content": content,
        "is_directory": False,
        "size": file_info.get("size") if file_info else None
    }


@router.post("/project/{project_id}/write")
def write_file(project_id: int, file_path: str, content: str, db: Session = Depends(get_db)):
    """Write a file"""
    project = get_project_by_id(db, project_id)
    success = file_manager.write_file(project.name, file_path, content)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to write file")
    return {"message": "File written successfully"}


@router.post("/project/{project_id}/create")
def create_file(project_id: int, file: FileCreate, db: Session = Depends(get_db)):
    """Create a new file"""
    project = get_project_by_id(db, project_id)
    success = file_manager.write_file(project.name, file.path, file.content or "")
    if not success:
        raise HTTPException(status_code=400, detail="Failed to create file")
    return {"message": "File created successfully"}


@router.post("/project/{project_id}/mkdir")
def create_directory(project_id: int, dir_path: str, db: Session = Depends(get_db)):
    """Create a directory"""
    project = get_project_by_id(db, project_id)
    success = file_manager.create_directory(project.name, dir_path)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to create directory")
    return {"message": "Directory created successfully"}


@router.delete("/project/{project_id}/delete")
def delete_file(project_id: int, file_path: str, db: Session = Depends(get_db)):
    """Delete a file or directory"""
    project = get_project_by_id(db, project_id)
    success = file_manager.delete_file(project.name, file_path)
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    return {"message": "File deleted successfully"}

