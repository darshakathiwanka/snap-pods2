import { useState, useEffect } from 'react';
import { containersApi, ContainerInfo } from '../services/api';
import ContainerList from './ContainerList';
import './Dashboard.css';

const Dashboard = () => {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContainers();
    const interval = setInterval(loadContainers, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadContainers = async () => {
    try {
      const response = await containersApi.list(true);
      setContainers(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load containers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading containers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Docker Containers</h2>
        <button onClick={loadContainers} className="refresh-btn">
          Refresh
        </button>
      </div>
      <ContainerList containers={containers} />
    </div>
  );
};

export default Dashboard;

