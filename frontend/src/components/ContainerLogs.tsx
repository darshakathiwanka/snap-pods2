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
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [follow, setFollow] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (containerId) {
      loadLogs();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [containerId, tail, follow]);

  useEffect(() => {
    if (autoRefresh && follow && containerId) {
      // Auto-refresh every 2 seconds when following logs
      intervalRef.current = setInterval(() => {
        loadLogs();
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, follow, containerId]);

  useEffect(() => {
    // Auto-scroll to bottom when logs update
    if (follow) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, follow]);

  const loadLogs = async () => {
    if (!containerId) return;
    setLoading(false); // Don't show loading on refresh
    setError(null);
    try {
      const response = await containersApi.logs(containerId, tail, follow);
      setLogs(response.data.logs);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load logs');
      setAutoRefresh(false); // Stop auto-refresh on error
    }
  };

  const handleClear = () => {
    setLogs('');
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
              onChange={(e) => {
                setTail(parseInt(e.target.value) || 100);
                setFollow(false); // Disable follow when changing tail
              }}
              min="10"
              max="10000"
              className="tail-input"
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={follow}
              onChange={(e) => setFollow(e.target.checked)}
            />
            Follow
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button onClick={loadLogs} className="refresh-btn">
            Refresh
          </button>
          <button onClick={handleClear} className="clear-btn">
            Clear
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
          <>
            <pre className="logs-text">{logs || 'No logs available'}</pre>
            {follow && <div ref={logsEndRef} />}
          </>
        )}
      </div>
    </div>
  );
};

export default ContainerLogs;
