import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SystemSnapshot, SystemLogEntry } from '../types';

export function useSocket() {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastLog, setLastLog] = useState<SystemLogEntry | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);
  const [inaugurationEngaged, setInaugurationEngaged] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // In dev mode on 5173, Vite proxies /socket.io to localhost:4000.
    // If accessing via mobile on LAN IP (e.g. 192.168.1.50:5173 or :4000),
    // connecting to window.location.origin works with the proxy or static server.
    // As a robust fallback, if connection fails, it can connect directly to port 4000.
    const url = window.location.port === '5173' 
      ? `${window.location.protocol}//${window.location.hostname}:4000`
      : window.location.origin;

    const s = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });

    socketRef.current = s;

    s.on('connect', () => {
      setConnected(true);
      s.emit('client:init');
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    s.on('system:snapshot', (snap: SystemSnapshot) => {
      setSnapshot(snap);
    });

    s.on('system:log', (entry: SystemLogEntry) => {
      setLastLog(entry);
    });

    s.on('error:notification', (err: { message: string }) => {
      setErrorNotification(err.message);
      setTimeout(() => setErrorNotification(null), 5000);
    });

    s.on('inauguration:triggered', () => {
      setInaugurationEngaged(true);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    snapshot,
    connected,
    lastLog,
    errorNotification,
    inaugurationEngaged,
    clearError: () => setErrorNotification(null),
    emit,
  };
}
