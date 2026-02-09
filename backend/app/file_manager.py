import os
from pathlib import Path
from typing import List, Optional
from .schemas import FileTreeItem


class FileManager:
    def __init__(self, base_path: str = "/app/projects"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def get_project_path(self, project_name: str) -> Path:
        """Get the path for a project"""
        return self.base_path / project_name

    def create_project_directory(self, project_name: str) -> Path:
        """Create a project directory"""
        project_path = self.get_project_path(project_name)
        project_path.mkdir(parents=True, exist_ok=True)
        return project_path

    def list_files(self, project_name: str, subpath: str = "") -> List[FileTreeItem]:
        """List files in a project directory"""
        project_path = self.get_project_path(project_name)
        target_path = project_path / subpath if subpath else project_path
        
        if not target_path.exists():
            return []
        
        if not target_path.is_dir():
            return []

        items = []
        for item in sorted(target_path.iterdir()):
            relative_path = str(item.relative_to(project_path))
            items.append(FileTreeItem(
                name=item.name,
                path=relative_path,
                is_directory=item.is_dir(),
                children=self._get_children(item, project_path) if item.is_dir() else None
            ))
        return items

    def _get_children(self, directory: Path, base_path: Path) -> List[FileTreeItem]:
        """Recursively get children for directory tree"""
        children = []
        try:
            for item in sorted(directory.iterdir()):
                relative_path = str(item.relative_to(base_path))
                children.append(FileTreeItem(
                    name=item.name,
                    path=relative_path,
                    is_directory=item.is_dir(),
                    children=self._get_children(item, base_path) if item.is_dir() else None
                ))
        except PermissionError:
            pass
        return children

    def read_file(self, project_name: str, file_path: str) -> Optional[str]:
        """Read file content"""
        project_path = self.get_project_path(project_name)
        full_path = project_path / file_path
        
        # Security check: ensure file is within project directory
        try:
            full_path.resolve().relative_to(project_path.resolve())
        except ValueError:
            return None
        
        if not full_path.exists() or not full_path.is_file():
            return None
        
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading file: {e}")
            return None

    def write_file(self, project_name: str, file_path: str, content: str) -> bool:
        """Write file content"""
        project_path = self.get_project_path(project_name)
        full_path = project_path / file_path
        
        # Security check: ensure file is within project directory
        try:
            full_path.resolve().relative_to(project_path.resolve())
        except ValueError:
            return False
        
        try:
            full_path.parent.mkdir(parents=True, exist_ok=True)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"Error writing file: {e}")
            return False

    def create_directory(self, project_name: str, dir_path: str) -> bool:
        """Create a directory"""
        project_path = self.get_project_path(project_name)
        full_path = project_path / dir_path
        
        # Security check
        try:
            full_path.resolve().relative_to(project_path.resolve())
        except ValueError:
            return False
        
        try:
            full_path.mkdir(parents=True, exist_ok=True)
            return True
        except Exception as e:
            print(f"Error creating directory: {e}")
            return False

    def delete_file(self, project_name: str, file_path: str) -> bool:
        """Delete a file or directory"""
        project_path = self.get_project_path(project_name)
        full_path = project_path / file_path
        
        # Security check
        try:
            full_path.resolve().relative_to(project_path.resolve())
        except ValueError:
            return False
        
        if not full_path.exists():
            return False
        
        try:
            if full_path.is_dir():
                import shutil
                shutil.rmtree(full_path)
            else:
                full_path.unlink()
            return True
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False

    def get_file_info(self, project_name: str, file_path: str) -> Optional[dict]:
        """Get file information"""
        project_path = self.get_project_path(project_name)
        full_path = project_path / file_path
        
        # Security check
        try:
            full_path.resolve().relative_to(project_path.resolve())
        except ValueError:
            return None
        
        if not full_path.exists():
            return None
        
        try:
            stat = full_path.stat()
            return {
                "path": file_path,
                "is_directory": full_path.is_dir(),
                "size": stat.st_size if full_path.is_file() else None,
                "modified": stat.st_mtime
            }
        except Exception as e:
            print(f"Error getting file info: {e}")
            return None

    def rename_file(self, project_name: str, old_path: str, new_path: str) -> bool:
        """Rename a file or directory"""
        project_path = self.get_project_path(project_name)
        old_full_path = project_path / old_path
        new_full_path = project_path / new_path
        
        # Security checks
        try:
            old_full_path.resolve().relative_to(project_path.resolve())
            new_full_path.resolve().relative_to(project_path.resolve())
        except ValueError:
            return False
        
        if not old_full_path.exists():
            return False
        
        if new_full_path.exists():
            return False  # Target already exists
        
        try:
            old_full_path.rename(new_full_path)
            return True
        except Exception as e:
            print(f"Error renaming file: {e}")
            return False

    def upload_file(self, project_name: str, file_path: str, file_content: bytes) -> bool:
        """Upload a file (write binary content)"""
        project_path = self.get_project_path(project_name)
        full_path = project_path / file_path
        
        # Security check
        try:
            full_path.resolve().relative_to(project_path.resolve())
        except ValueError:
            return False
        
        try:
            full_path.parent.mkdir(parents=True, exist_ok=True)
            with open(full_path, 'wb') as f:
                f.write(file_content)
            return True
        except Exception as e:
            print(f"Error uploading file: {e}")
            return False


file_manager = FileManager()

