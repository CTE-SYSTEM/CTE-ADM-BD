import { useEffect, useRef, useState } from 'react';
import { createNotificationsSocket } from '../services/notificationsSocket';

const DEFAULT_MAX_NOTIFICATIONS = 25;

const playNotificationSound = async () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    if (audioContext.state === 'suspended') {
      await audioContext.resume().catch(() => {});
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const startedAt = audioContext.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, startedAt);
    oscillator.frequency.exponentialRampToValueAtTime(1170, startedAt + 0.12);
    gainNode.gain.setValueAtTime(0.0001, startedAt);
    gainNode.gain.exponentialRampToValueAtTime(0.18, startedAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.36);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startedAt);
    oscillator.stop(startedAt + 0.38);
    oscillator.onended = () => audioContext.close().catch(() => {});
  } catch (error) {
    console.warn('No se pudo reproducir el sonido de notificacion:', error);
  }
};

const maybeShowBrowserNotification = (notification) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (window.Notification.permission !== 'granted') return;

  try {
    const browserNotification = new window.Notification(notification?.title || 'Notificacion', {
      body: notification?.message || '',
      tag: notification?.id || notification?.type || 'cte-notificacion',
      icon: '/favicon.ico',
    });

    window.setTimeout(() => browserNotification.close(), 5000);
  } catch (error) {
    console.warn('No se pudo mostrar la notificacion del navegador:', error);
  }
};

export const useRealtimeNotifications = ({
  enabled = true,
  onNotification,
  onRefresh,
  refreshIntervalMs = 60000,
  maxNotifications = DEFAULT_MAX_NOTIFICATIONS,
} = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const onNotificationRef = useRef(onNotification);
  const onRefreshRef = useRef(onRefresh);
  const permissionRequestedRef = useRef(false);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('Notification' in window)) return;
    if (window.Notification.permission === 'default' && !permissionRequestedRef.current) {
      permissionRequestedRef.current = true;
      window.Notification.requestPermission().catch(() => {});
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    const socket = createNotificationsSocket();
    if (!socket) return undefined;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('notificacion', (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, maxNotifications));
      playNotificationSound();
      maybeShowBrowserNotification(notification);

      if (typeof onNotificationRef.current === 'function') {
        onNotificationRef.current(notification);
      }

      if (typeof onRefreshRef.current === 'function') {
        onRefreshRef.current(notification);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [enabled, maxNotifications]);

  useEffect(() => {
    if (!enabled || !refreshIntervalMs) return undefined;

    const intervalId = window.setInterval(() => {
      if (typeof onRefreshRef.current === 'function') {
        onRefreshRef.current();
      }
    }, refreshIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [enabled, refreshIntervalMs]);

  const clearNotifications = () => setNotifications([]);

  return {
    notifications,
    connected,
    clearNotifications,
    setNotifications,
  };
};

export default useRealtimeNotifications;
