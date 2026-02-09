import docker
from typing import List, Dict, Any, Optional
import os
from .schemas import ContainerInfo, ContainerStats


class DockerClient:
    def __init__(self):
        # Connect to Docker daemon via socket
        socket_path = os.getenv("DOCKER_SOCKET", "/var/run/docker.sock")
        self.client = docker.DockerClient(base_url=f"unix://{socket_path}")

    def list_containers(self, all: bool = True) -> List[ContainerInfo]:
        """List all containers"""
        containers = self.client.containers.list(all=all)
        result = []
        for container in containers:
            ports = []
            if container.attrs.get("NetworkSettings", {}).get("Ports"):
                for container_port, host_ports in container.attrs["NetworkSettings"]["Ports"].items():
                    if host_ports:
                        for host_port in host_ports:
                            ports.append({
                                "container_port": container_port,
                                "host_ip": host_port.get("HostIp", ""),
                                "host_port": host_port.get("HostPort", "")
                            })
            
            result.append(ContainerInfo(
                id=container.id,
                name=container.name,
                image=container.image.tags[0] if container.image.tags else container.image.id[:12],
                status=container.status,
                created=container.attrs["Created"],
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
            cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
            system_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"]["system_cpu_usage"]
            cpu_percent = 0.0
            if system_delta > 0:
                cpu_percent = (cpu_delta / system_delta) * len(stats["cpu_stats"]["cpu_usage"]["percpu_usage"]) * 100.0

            # Memory stats
            memory_usage = stats["memory_stats"].get("usage", 0)
            memory_limit = stats["memory_stats"].get("limit", 0)
            memory_percent = (memory_usage / memory_limit * 100.0) if memory_limit > 0 else 0.0

            # Network stats
            network_rx = 0
            network_tx = 0
            if "networks" in stats:
                for network in stats["networks"].values():
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


docker_client = DockerClient()

