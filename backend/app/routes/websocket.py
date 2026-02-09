from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from ..docker_client import docker_client
import json
import asyncio
import docker


router = APIRouter()


@router.websocket("/ws/terminal/{container_id}")
async def websocket_terminal(websocket: WebSocket, container_id: str):
    """WebSocket endpoint for container terminal access"""
    await websocket.accept()
    
    try:
        container = docker_client.get_container(container_id)
        if not container:
            await websocket.close(code=1008, reason="Container not found")
            return
        
        # Create exec instance with proper configuration
        exec_id = container.exec_create(
            cmd="/bin/sh",
            stdin=True,
            stdout=True,
            stderr=True,
            tty=True
        )
        
        # Start exec with socket for bidirectional communication
        exec_socket = container.exec_start(
            exec_id=exec_id['Id'],
            socket=True,
            tty=True
        )
        
        # Start reading from container stdout/stderr in a separate task
        async def read_output():
            try:
                while True:
                    try:
                        data = exec_socket.recv(4096)
                        if data:
                            await websocket.send_text(data.decode('utf-8', errors='replace'))
                        else:
                            break
                    except Exception as e:
                        if "not a socket" not in str(e).lower():
                            print(f"Error reading output: {e}")
                        break
            except Exception as e:
                print(f"Read output error: {e}")
        
        # Start reading task
        read_task = asyncio.create_task(read_output())
        
        # Handle incoming messages (stdin)
        try:
            while True:
                data = await websocket.receive_text()
                # Send data to container stdin via socket
                try:
                    exec_socket.sendall(data.encode('utf-8'))
                except Exception as e:
                    print(f"Error sending to container: {e}")
                    break
        except WebSocketDisconnect:
            read_task.cancel()
            try:
                exec_socket.close()
            except:
                pass
    except Exception as e:
        print(f"Terminal error: {e}")
        try:
            await websocket.close(code=1011, reason=str(e))
        except:
            pass


@router.websocket("/ws/stats/{container_id}")
async def websocket_stats(websocket: WebSocket, container_id: str):
    """WebSocket endpoint for live container stats"""
    await websocket.accept()
    
    try:
        container = docker_client.get_container(container_id)
        if not container:
            await websocket.close(code=1008, reason="Container not found")
            return
        
        try:
            while True:
                stats = docker_client.get_container_stats(container_id)
                if stats:
                    await websocket.send_json(stats.dict())
                await asyncio.sleep(1)  # Update every second
        except WebSocketDisconnect:
            pass
    except Exception as e:
        print(f"Stats error: {e}")
        await websocket.close(code=1011, reason=str(e))

