import { useState, useEffect, useRef } from 'react';
import { StatsWebSocket } from '../services/websocket';
import { ContainerStats } from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './StatsChart.css';

interface StatsChartProps {
  containerId: string;
}

interface StatsDataPoint {
  time: string;
  cpu: number;
  memory: number;
}

const StatsChart = ({ containerId }: StatsChartProps) => {
  const [statsData, setStatsData] = useState<StatsDataPoint[]>([]);
  const [currentStats, setCurrentStats] = useState<ContainerStats | null>(null);
  const wsRef = useRef<StatsWebSocket | null>(null);
  const maxDataPoints = 30;

  useEffect(() => {
    wsRef.current = new StatsWebSocket();
    const ws = wsRef.current;

    ws.onStats((stats: ContainerStats) => {
      setCurrentStats(stats);
      const now = new Date().toLocaleTimeString();
      setStatsData((prev) => {
        const newData = [...prev, { time: now, cpu: stats.cpu_percent, memory: stats.memory_percent }];
        return newData.slice(-maxDataPoints);
      });
    });

    ws.onError((error) => {
      console.error('Stats WebSocket error:', error);
    });

    ws.connect(containerId);

    return () => {
      ws.disconnect();
    };
  }, [containerId]);

  const formatMemory = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <div className="stats-chart">
      {currentStats && (
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-label">CPU:</span>
            <span className="stat-value">{currentStats.cpu_percent.toFixed(2)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Memory:</span>
            <span className="stat-value">
              {formatMemory(currentStats.memory_usage)} / {formatMemory(currentStats.memory_limit)} ({currentStats.memory_percent.toFixed(2)}%)
            </span>
          </div>
        </div>
      )}
      {statsData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={statsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="cpu"
              stroke="#3498db"
              name="CPU %"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="memory"
              stroke="#e74c3c"
              name="Memory %"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="loading-stats">Loading stats...</div>
      )}
    </div>
  );
};

export default StatsChart;

