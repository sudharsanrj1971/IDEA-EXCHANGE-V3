import { useEffect } from 'react';
import socket from '../services/socket';
import { useProjectStore, useNotificationStore } from '../store/uiStores';

export function useSocket(projectId) {
  const { addContribution, updateScore } = useProjectStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!projectId) return;

    socket.connect();
    socket.joinProject(projectId);

    socket.on('contribution:new', (data) => {
      addContribution(data.block);
      if (data.newScore) updateScore(data.newScore);
    });

    socket.on('score:updated', (data) => {
      updateScore(data.newScore);
    });

    socket.on('notification:new', (data) => {
      addNotification(data.notification);
    });

    socket.on('tamper:alert', (data) => {
      // Handle server-side tamper detection real-time
      console.warn('TAMPER ALERT:', data);
    });

    return () => {
      socket.leaveProject(projectId);
      socket.off('contribution:new');
      socket.off('score:updated');
      socket.off('notification:new');
      socket.off('tamper:alert');
    };
  }, [projectId]);
}
