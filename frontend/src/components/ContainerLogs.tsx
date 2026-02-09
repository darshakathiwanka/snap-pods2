import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { containersApi } from '../services/api';
import './ContainerLogs.css';

const ContainerLogs = () => {
  const { containerId } = useParams<{ containerId: string }>();
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tail, setTail] = useState(100);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (containerId) {
      loadLogs();
    }
  }, [containerId, tail]);

  useEffect(() => {
    // Auto-scroll to bottom when logs update
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const loadLogs = async () => {
    if (!containerId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await containersApi.logs(containerId, tail);
      setLogs(response.data.logs);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logs-container">
      <div className="logs-header">
        <h3>Logs - Container: {containerId?.substring(0, 12)}</h3>
        <div className="logs-controls">
          <label>
            Tail lines:
            <input
              type="number"
              value={tail}
              onChange={(e) => setTail(parseInt(e.target.value) || 100)}
              min="10"
              max="10000"
              className="tail-input"
            />
          </label>
          <button onClick={loadLogs} className="refresh-btn">
            Refresh
          </button>
          <button onClick={() => navigate('/')} className="close-btn">
            Close
          </button>
        </div>
      </div>
      <div className="logs-content">
        {loading ? (
          <div className="loading">Loading logs...</div>
        ) : error ? (
          <div className="error">Error: {error}</div>
        ) : (
          <pre className="logs-text">{logs || 'No logs available'}</pre>
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};

export default ContainerLogs;

