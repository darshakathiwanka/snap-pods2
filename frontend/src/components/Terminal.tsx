import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { TerminalWebSocket } from '../services/websocket';
import 'xterm/css/xterm.css';
import './Terminal.css';

const Terminal = () => {
  const { containerId } = useParams<{ containerId: string }>();
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const wsRef = useRef<TerminalWebSocket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerId || !terminalRef.current) return;

    // Initialize xterm
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);
    
    xterm.open(terminalRef.current);
    fitAddon.fit();
    
    xtermRef.current = xterm;

    // Initialize WebSocket
    const ws = new TerminalWebSocket();
    wsRef.current = ws;

    ws.onMessage((data: string) => {
      xterm.write(data);
    });

    ws.onError((error) => {
      xterm.writeln('\r\n\x1b[31mConnection error. Please check if container is running.\x1b[0m');
    });

    ws.onClose(() => {
      xterm.writeln('\r\n\x1b[33mConnection closed.\x1b[0m');
    });

    ws.connect(containerId);

    // Handle user input
    xterm.onData((data: string) => {
      ws.send(data);
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      ws.disconnect();
      xterm.dispose();
    };
  }, [containerId]);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <h3>Terminal - Container: {containerId?.substring(0, 12)}</h3>
        <button onClick={() => navigate('/')} className="close-btn">
          Close
        </button>
      </div>
      <div ref={terminalRef} className="terminal" />
    </div>
  );
};

export default Terminal;

