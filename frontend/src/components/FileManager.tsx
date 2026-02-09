import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { filesApi, FileTreeItem, containersApi } from '../services/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import './FileManager.css';

interface FileManagerProps {
  projectId: number;
}

const FileManager = ({ projectId }: FileManagerProps) => {
  const [files, setFiles] = useState<FileTreeItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isDirectory, setIsDirectory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      const response = await filesApi.list(projectId);
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleFileSelect = async (filePath: string, isDir: boolean) => {
    if (isDir) {
      // Toggle directory expansion (simplified - could be improved)
      return;
    }
    setSelectedFile(filePath);
    setLoading(true);
    try {
      const response = await filesApi.read(projectId, filePath);
      setFileContent(response.data.content);
    } catch (error) {
      alert('Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    try {
      await filesApi.write(projectId, selectedFile, fileContent);
      alert('File saved successfully');
    } catch (error) {
      alert('Failed to save file');
    }
  };

  const handleCreate = async () => {
    if (!newFileName.trim()) return;
    try {
      if (isDirectory) {
        await filesApi.mkdir(projectId, newFileName);
      } else {
        await filesApi.create(projectId, newFileName, '');
      }
      setNewFileName('');
      setIsDirectory(false);
      setShowCreateModal(false);
      loadFiles();
      if (!isDirectory) {
        handleFileSelect(newFileName, false);
      }
    } catch (error) {
      alert('Failed to create file/directory');
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!confirm(`Are you sure you want to delete ${filePath}?`)) return;
    try {
      await filesApi.delete(projectId, filePath);
      loadFiles();
      if (selectedFile === filePath) {
        setSelectedFile(null);
        setFileContent('');
      }
    } catch (error) {
      alert('Failed to delete file');
    }
  };

  const handleDeploy = async () => {
    if (!confirm('Deploy this project using docker-compose?')) return;
    try {
      await containersApi.deploy(projectId);
      alert('Deployment started! Check containers in dashboard.');
      navigate('/');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to deploy');
    }
  };

  const renderFileTree = (items: FileTreeItem[], level: number = 0) => {
    return items.map((item) => (
      <div key={item.path} style={{ paddingLeft: `${level * 20}px` }}>
        <div
          className={`file-item ${selectedFile === item.path ? 'selected' : ''}`}
          onClick={() => handleFileSelect(item.path, item.is_directory)}
        >
          <span className="file-icon">
            {item.is_directory ? '📁' : '📄'}
          </span>
          <span className="file-name">{item.name}</span>
          <button
            className="delete-file-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.path);
            }}
          >
            ×
          </button>
        </div>
        {item.children && item.children.length > 0 && (
          <div className="file-children">
            {renderFileTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'dockerfile': 'dockerfile',
      'yml': 'yaml',
      'yaml': 'yaml',
      'json': 'json',
      'py': 'python',
      'js': 'javascript',
      'ts': 'typescript',
      'html': 'html',
      'css': 'css',
      'sh': 'bash',
    };
    return langMap[ext || ''] || 'text';
  };

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <h2>File Manager</h2>
        <div className="header-actions">
          <button
            className="deploy-btn"
            onClick={handleDeploy}
          >
            🚀 Deploy
          </button>
          <button
            className="create-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + New File/Folder
          </button>
        </div>
      </div>
      <div className="file-manager-content">
        <div className="file-tree">
          <div className="file-tree-header">Files</div>
          <div className="file-tree-content">
            {files.length === 0 ? (
              <div className="empty-files">No files yet. Create a file to get started.</div>
            ) : (
              renderFileTree(files)
            )}
          </div>
        </div>
        <div className="file-editor">
          {selectedFile ? (
            <>
              <div className="editor-header">
                <span>{selectedFile}</span>
                <button className="save-btn" onClick={handleSave}>
                  Save
                </button>
              </div>
              {loading ? (
                <div className="loading">Loading file...</div>
              ) : (
                <div className="editor-content">
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="file-textarea"
                  />
                  <div className="preview">
                    <SyntaxHighlighter
                      language={getLanguage(selectedFile)}
                      style={vscDarkPlus}
                    >
                      {fileContent}
                    </SyntaxHighlighter>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-file-selected">Select a file to edit</div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New</h3>
            <label>
              <input
                type="checkbox"
                checked={isDirectory}
                onChange={(e) => setIsDirectory(e.target.checked)}
              />
              Directory
            </label>
            <input
              type="text"
              placeholder={isDirectory ? "Directory name" : "File name"}
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={handleCreate}>Create</button>
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;

