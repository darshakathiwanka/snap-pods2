import { useState, useEffect, useRef } from 'react';
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
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renameOldPath, setRenameOldPath] = useState('');
  const [renameNewName, setRenameNewName] = useState('');
  const [isDirectory, setIsDirectory] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [createInPath, setCreateInPath] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const handleFileSelect = async (filePath: string, isDir: boolean) => {
    if (isDir) {
      toggleDirectory(filePath);
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
    const fullPath = createInPath ? `${createInPath}/${newFileName}` : newFileName;
    try {
      if (isDirectory) {
        await filesApi.mkdir(projectId, fullPath);
      } else {
        await filesApi.create(projectId, fullPath, '');
      }
      setNewFileName('');
      setIsDirectory(false);
      setCreateInPath('');
      setShowCreateModal(false);
      loadFiles();
      if (!isDirectory) {
        handleFileSelect(fullPath, false);
      }
      // Expand parent directory if creating inside a folder
      if (createInPath) {
        setExpandedDirs(new Set([...expandedDirs, createInPath]));
      }
    } catch (error) {
      alert('Failed to create file/directory');
    }
  };

  const handleRename = async () => {
    if (!renameNewName.trim()) return;
    const pathParts = renameOldPath.split('/');
    pathParts[pathParts.length - 1] = renameNewName;
    const newPath = pathParts.join('/');
    
    try {
      await filesApi.rename(projectId, renameOldPath, newPath);
      setShowRenameModal(false);
      setRenameOldPath('');
      setRenameNewName('');
      loadFiles();
      if (selectedFile === renameOldPath) {
        setSelectedFile(newPath);
        handleFileSelect(newPath, false);
      }
    } catch (error) {
      alert('Failed to rename file/directory');
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent, targetPath: string = '') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const file of droppedFiles) {
      const filePath = targetPath ? `${targetPath}/${file.name}` : file.name;
      try {
        const fileContent = await file.arrayBuffer();
        await filesApi.upload(projectId, filePath, new File([fileContent], file.name));
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        alert(`Failed to upload ${file.name}`);
      }
    }
    loadFiles();
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const filePath = createInPath ? `${createInPath}/${file.name}` : file.name;
      try {
        await filesApi.upload(projectId, filePath, file);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        alert(`Failed to upload ${file.name}`);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setCreateInPath('');
    loadFiles();
  };

  const renderFileTree = (items: FileTreeItem[], level: number = 0) => {
    return items.map((item) => {
      const isExpanded = expandedDirs.has(item.path);
      const hasChildren = item.children && item.children.length > 0;
      
      return (
        <div key={item.path}>
          <div
            className={`file-item ${selectedFile === item.path ? 'selected' : ''} ${isDragging ? 'drag-over' : ''}`}
            onClick={() => handleFileSelect(item.path, item.is_directory)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (item.is_directory) {
                setCreateInPath(item.path);
                setShowCreateModal(true);
              } else {
                setRenameOldPath(item.path);
                setRenameNewName(item.name);
                setShowRenameModal(true);
              }
            }}
            onDragOver={item.is_directory ? handleDragOver : undefined}
            onDragLeave={item.is_directory ? handleDragLeave : undefined}
            onDrop={item.is_directory ? (e) => handleDrop(e, item.path) : undefined}
          >
            <span className="file-icon" onClick={(e) => {
              e.stopPropagation();
              if (item.is_directory) {
                toggleDirectory(item.path);
              }
            }}>
              {item.is_directory ? (isExpanded ? '📂' : '📁') : '📄'}
            </span>
            <span className="file-name">{item.name}</span>
            <div className="file-actions">
              <button
                className="rename-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameOldPath(item.path);
                  setRenameNewName(item.name);
                  setShowRenameModal(true);
                }}
                title="Rename"
              >
                ✏️
              </button>
              <button
                className="delete-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.path);
                }}
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
          {item.is_directory && isExpanded && hasChildren && (
            <div className="file-children">
              {renderFileTree(item.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
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
            onClick={() => {
              setCreateInPath('');
              setShowCreateModal(true);
            }}
          >
            + New File/Folder
          </button>
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            📤 Upload Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>
      </div>
      <div className="file-manager-content">
        <div className="file-tree">
          <div className="file-tree-header">Files</div>
          <div
            className={`file-tree-content ${isDragging ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, '')}
          >
            {files.length === 0 ? (
              <div className="empty-files">
                No files yet. Create a file or drag & drop files here.
              </div>
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
            <div className="no-file-selected">
              Select a file to edit or create a new one
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New {createInPath && `in ${createInPath}`}</h3>
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
              <button onClick={() => {
                setShowCreateModal(false);
                setCreateInPath('');
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Rename</h3>
            <input
              type="text"
              value={renameNewName}
              onChange={(e) => setRenameNewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={handleRename}>Rename</button>
              <button onClick={() => setShowRenameModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
