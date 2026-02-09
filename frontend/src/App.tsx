import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ProjectSelector from './components/ProjectSelector';
import FileManager from './components/FileManager';
import ContainerLogs from './components/ContainerLogs';
import Terminal from './components/Terminal';
import './App.css';

function App() {
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  return (
    <Router>
      <div className="app-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <h1>SnapPods</h1>
          </div>
          <ProjectSelector
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
          />
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/project/:projectId/files"
              element={
                selectedProject ? (
                  <FileManager projectId={selectedProject} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="/container/:containerId/logs" element={<ContainerLogs />} />
            <Route path="/container/:containerId/terminal" element={<Terminal />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

