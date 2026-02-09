import docker
from docker import APIClient
from typing import List, Dict, Any, Optional
import os
from .schemas import ContainerInfo, ContainerStats


class DockerClient:
    def __init__(self):
        self._client = None
        self._socket_path = os.getenv("DOCKER_SOCKET", "/var/run/docker.sock")
    
    @property
    def client(self):
        """Lazy initialization of Docker client"""
        if self._client is None:
            # Check if socket file exists
            if not os.path.exists(self._socket_path):
                raise Exception(f"Docker socket not found at {self._socket_path}. Make sure Docker socket is mounted.")
            
            # Remove problematic environment variables that interfere with Unix sockets
            env_vars_to_clear = ["DOCKER_HOST", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH"]
            for key in env_vars_to_clear:
                if key in os.environ:
                    os.environ.pop(key)
            
            try:
                # Construct the proper Unix socket URL
                socket_url = f"unix://{self._socket_path}"
                print(f"DEBUG: Attempting to connect to {socket_url}")
                
                # Initialize the high-level client directly using base_url
                # This avoids the "unexpected keyword argument 'api'" error
                self._client = docker.DockerClient(base_url=socket_url)
                
                # Verify the connection works
                self._client.ping()
                print("DEBUG: Successfully connected to Docker daemon")
            except Exception as e:
                error_msg = str(e)
                print(f"Error connecting to Docker socket at {self._socket_path}: {error_msg}")
                raise Exception(f"Failed to connect to Docker daemon: {error_msg}")
        
        return self._client

    def list_containers(self, all: bool = True) -> List[ContainerInfo]:
        """List all containers"""
        containers = self.client.containers.list(all=all)
        result = []
        for container in containers:
            ports = []
            # Extract port mappings safely
            network_settings = container.attrs.get("NetworkSettings", {})
            port_data = network_settings.get("Ports") or {}
            
            for container_port, host_ports in port_data.items():
                if host_ports:
                    for host_port in host_ports:
                        ports.append({
                            "container_port": container_port,
                            "host_ip": host_port.get("HostIp", ""),
                            "host_port": host_port.get("HostPort", "")
                        })
            
            # Safely handle image tags
            image_name = container.image.tags[0] if container.image.tags else container.image.id[:12]
            
            result.append(ContainerInfo(
                id=container.id,
                name=container.name,
                image=image_name,
                status=container.status,
                created=container.attrs.get("Created", ""),
                ports=ports
            ))
        return result

    def get_container(self, container_id: str):
        """Get container by ID"""
        return self.client.containers.get(container_id)

    def stop_container(self, container_id: str) -> bool:
        """Stop a container"""
        try:
            container = self.client.containers.get(container_id)
            container.stop()
            return True
        except Exception as e:
            print(f"Error stopping container: {e}")
            return False

    def start_container(self, container_id: str) -> bool:
        """Start a container"""
        try:
            container = self.client.containers.get(container_id)
            container.start()
            return True
        except Exception as e:
            print(f"Error starting container: {e}")
            return False

    def get_container_stats(self, container_id: str) -> Optional[ContainerStats]:
        """Get container stats"""
        try:
            container = self.client.containers.get(container_id)
            stats = container.stats(stream=False)
            
            # Calculate CPU percentage
            cpu_stats = stats.get("cpu_stats", {})
            precpu_stats = stats.get("precpu_stats", {})
            
            cpu_usage = cpu_stats.get("cpu_usage", {}).get("total_usage", 0)
            precpu_usage = precpu_stats.get("cpu_usage", {}).get("total_usage", 0)
            
            system_cpu_usage = cpu_stats.get("system_cpu_usage", 0)
            pre_system_cpu_usage = precpu_stats.get("system_cpu_usage", 0)
            
            cpu_percent = 0.0
            cpu_delta = cpu_usage - precpu_usage
            system_delta = system_cpu_usage - pre_system_cpu_usage
            
            if system_delta > 0 and cpu_delta > 0:
                # Number of CPU cores
                num_cores = len(cpu_stats.get("cpu_usage", {}).get("percpu_usage") or [1])
                cpu_percent = (cpu_delta / system_delta) * num_cores * 100.0

            # Memory stats
            mem_stats = stats.get("memory_stats", {})
            memory_usage = mem_stats.get("usage", 0)
            memory_limit = mem_stats.get("limit", 0)
            memory_percent = (memory_usage / memory_limit * 100.0) if memory_limit > 0 else 0.0

            # Network stats
            network_rx = 0
            network_tx = 0
            networks = stats.get("networks", {})
            for network in networks.values():
                network_rx += network.get("rx_bytes", 0)
                network_tx += network.get("tx_bytes", 0)

            return ContainerStats(
                container_id=container_id,
                cpu_percent=round(cpu_percent, 2),
                memory_usage=memory_usage,
                memory_limit=memory_limit,
                memory_percent=round(memory_percent, 2),
                network_rx=network_rx,
                network_tx=network_tx
            )
        except Exception as e:
            print(f"Error getting container stats: {e}")
            return None

    def get_container_logs(self, container_id: str, tail: int = 100, follow: bool = False):
        """Get container logs"""
        try:
            container = self.client.containers.get(container_id)
            return container.logs(tail=tail, follow=follow, stream=follow)
        except Exception as e:
            print(f"Error getting container logs: {e}")
            return None

    def exec_command(self, container_id: str, command: str = "/bin/sh"):
        """Execute command in container"""
        try:
            container = self.client.containers.get(container_id)
            return container.exec_run(command, stdin=True, stdout=True, stderr=True, tty=True, stream=True, detach=False)
        except Exception as e:
            print(f"Error executing command: {e}")
            return None


# Singleton instance
docker_client = DockerClient()