import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContainerInfo, containersApi } from '../services/api';
import StatsChart from './StatsChart';
import './ContainerList.css';

interface ContainerListProps {
  containers: ContainerInfo[];
}

const ContainerList = ({ containers }: ContainerListProps) => {
  const navigate = useNavigate();
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(new Set());
  const [stoppingContainers, setStoppingContainers] = useState<Set<string>>(new Set());

  const toggleExpanded = (containerId: string) => {
    const newExpanded = new Set(expandedContainers);
    if (newExpanded.has(containerId)) {
      newExpanded.delete(containerId);
    } else {
      newExpanded.add(containerId);
    }
    setExpandedContainers(newExpanded);
  };

  const handleStop = async (containerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStoppingContainers(new Set([...stoppingContainers, containerId]));
    try {
      await containersApi.stop(containerId);
    } catch (error) {
      alert('Failed to stop container');
    } finally {
      setStoppingContainers(new Set([...stoppingContainers].filter(id => id !== containerId)));
    }
  };

  const handleStart = async (containerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await containersApi.start(containerId);
    } catch (error) {
      alert('Failed to start container');
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('Up')) return '#27ae60';
    if (status.includes('Exited')) return '#e74c3c';
    return '#f39c12';
  };

  return (
    <div className="container-list">
      {containers.length === 0 ? (
        <div className="empty-state">No containers found</div>
      ) : (
        containers.map((container) => (
          <div key={container.id} className="container-card">
            <div
              className="container-header"
              onClick={() => toggleExpanded(container.id)}
            >
              <div className="container-info">
                <h3>{container.name}</h3>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(container.status) }}
                >
                  {container.status}
                </span>
              </div>
              <div className="container-actions">
                {container.status.includes('Up') ? (
                  <button
                    className="action-btn stop-btn"
                    onClick={(e) => handleStop(container.id, e)}
                    disabled={stoppingContainers.has(container.id)}
                  >
                    {stoppingContainers.has(container.id) ? 'Stopping...' : 'Stop'}
                  </button>
                ) : (
                  <button
                    className="action-btn start-btn"
                    onClick={(e) => handleStart(container.id, e)}
                  >
                    Start
                  </button>
                )}
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/container/${container.id}/logs`);
                  }}
                >
                  Logs
                </button>
                {container.status.includes('Up') && (
                  <>
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/container/${container.id}/terminal`);
                      }}
                    >
                      Terminal
                    </button>
                  </>
                )}
              </div>
            </div>
            {expandedContainers.has(container.id) && (
              <div className="container-details">
                <div className="detail-row">
                  <strong>Image:</strong> {container.image}
                </div>
                <div className="detail-row">
                  <strong>ID:</strong> {container.id.substring(0, 12)}
                </div>
                {container.ports.length > 0 && (
                  <div className="detail-row">
                    <strong>Ports:</strong>
                    {container.ports.map((port, idx) => (
                      <span key={idx} className="port-info">
                        {port.host_ip}:{port.host_port} → {port.container_port}
                      </span>
                    ))}
                  </div>
                )}
                {container.status.includes('Up') && (
                  <div className="stats-section">
                    <StatsChart containerId={container.id} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ContainerList;

