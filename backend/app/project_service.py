from sqlalchemy.orm import Session
from .models import Project
from .file_manager import file_manager
from typing import List, Optional


class ProjectService:
    @staticmethod
    def create_project(db: Session, name: str) -> Optional[Project]:
        """Create a new project"""
        # Check if project already exists
        existing = db.query(Project).filter(Project.name == name).first()
        if existing:
            return None
        
        # Create project directory
        project_path = file_manager.create_project_directory(name)
        
        # Create database record
        project = Project(name=name, path=str(project_path))
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def get_project(db: Session, project_id: int) -> Optional[Project]:
        """Get project by ID"""
        return db.query(Project).filter(Project.id == project_id).first()

    @staticmethod
    def get_project_by_name(db: Session, name: str) -> Optional[Project]:
        """Get project by name"""
        return db.query(Project).filter(Project.name == name).first()

    @staticmethod
    def list_projects(db: Session) -> List[Project]:
        """List all projects"""
        return db.query(Project).all()

    @staticmethod
    def delete_project(db: Session, project_id: int) -> bool:
        """Delete a project"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return False
        
        # Delete project directory
        import shutil
        project_path = file_manager.get_project_path(project.name)
        if project_path.exists():
            shutil.rmtree(project_path)
        
        db.delete(project)
        db.commit()
        return True


project_service = ProjectService()

