import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Project {
  id: number;
  name: string;
  path: string;
  created_at: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  created: string;
  ports: Array<{
    container_port: string;
    host_ip: string;
    host_port: string;
  }>;
}

export interface ContainerStats {
  container_id: string;
  cpu_percent: number;
  memory_usage: number;
  memory_limit: number;
  memory_percent: number;
  network_rx: number;
  network_tx: number;
}

export interface FileTreeItem {
  name: string;
  path: string;
  is_directory: boolean;
  children?: FileTreeItem[];
}

export const projectsApi = {
  list: () => api.get<Project[]>('/api/projects'),
  get: (id: number) => api.get<Project>(`/api/projects/${id}`),
  create: (name: string) => api.post<Project>('/api/projects', { name }),
  delete: (id: number) => api.delete(`/api/projects/${id}`),
};

export const filesApi = {
  list: (projectId: number, subpath?: string) =>
    api.get<FileTreeItem[]>(`/api/files/project/${projectId}/tree`, {
      params: { subpath },
    }),
  read: (projectId: number, filePath: string) =>
    api.get(`/api/files/project/${projectId}/read`, {
      params: { file_path: filePath },
    }),
  write: (projectId: number, filePath: string, content: string) =>
    api.post(`/api/files/project/${projectId}/write`, null, {
      params: { file_path: filePath, content },
    }),
  create: (projectId: number, path: string, content: string = '') =>
    api.post(`/api/files/project/${projectId}/create`, { path, content }),
  mkdir: (projectId: number, dirPath: string) =>
    api.post(`/api/files/project/${projectId}/mkdir`, null, {
      params: { dir_path: dirPath },
    }),
  delete: (projectId: number, filePath: string) =>
    api.delete(`/api/files/project/${projectId}/delete`, {
      params: { file_path: filePath },
    }),
};

export const containersApi = {
  list: (all: boolean = true) =>
    api.get<ContainerInfo[]>('/api/containers', { params: { all } }),
  stats: (containerId: string) =>
    api.get<ContainerStats>(`/api/containers/${containerId}/stats`),
  stop: (containerId: string) =>
    api.post(`/api/containers/${containerId}/stop`),
  start: (containerId: string) =>
    api.post(`/api/containers/${containerId}/start`),
  logs: (containerId: string, tail: number = 100) =>
    api.get<{ logs: string }>(`/api/containers/${containerId}/logs`, {
      params: { tail },
    }),
  deploy: (projectId: number) =>
    api.post('/api/containers/deploy', { project_id: projectId }),
};

export default api;

