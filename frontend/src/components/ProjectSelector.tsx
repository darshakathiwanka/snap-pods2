import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi, Project } from '../services/api';
import './ProjectSelector.css';

interface ProjectSelectorProps {
  selectedProject: number | null;
  onSelectProject: (projectId: number | null) => void;
}

const ProjectSelector = ({ selectedProject, onSelectProject }: ProjectSelectorProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsApi.list();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const response = await projectsApi.create(newProjectName.trim());
      setProjects([...projects, response.data]);
      setNewProjectName('');
      setShowCreateModal(false);
      onSelectProject(response.data.id);
      navigate(`/project/${response.data.id}/files`);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsApi.delete(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject === projectId) {
        onSelectProject(null);
        navigate('/');
      }
    } catch (error) {
      alert('Failed to delete project');
    }
  };

  const handleSelectProject = (projectId: number) => {
    onSelectProject(projectId);
    navigate(`/project/${projectId}/files`);
  };

  return (
    <div className="project-selector">
      <div className="project-list">
        {loading ? (
          <div className="loading">Loading projects...</div>
        ) : (
          <>
            {projects.map((project) => (
              <div
                key={project.id}
                className={`project-item ${selectedProject === project.id ? 'active' : ''}`}
                onClick={() => handleSelectProject(project.id)}
              >
                <span className="project-name">{project.name}</span>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </>
        )}
      </div>
      <button
        className="create-project-btn"
        onClick={() => setShowCreateModal(true)}
      >
        + New Project
      </button>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Project</h3>
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={handleCreateProject}>Create</button>
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;

