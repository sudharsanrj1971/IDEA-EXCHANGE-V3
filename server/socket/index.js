const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Project = require('../models/Project.model');
const { logSecurityEvent } = require('../utils/securityLogger');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

let io;

/**
 * Socket.io Entry Point
 * Implements FIX 07: Strict room authorization and handshake identity verification.
 */
const initSocket = (server) => {
  const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'];
  
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    }
  });

  // Handshake Authorization Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth.token;
      
      // Fallback: Read from cookies in handshake headers
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, c) => {
          const [k, v] = c.trim().split('=');
          acc[k] = v;
          return acc;
        }, {});
        token = cookies.accessToken;
      }

      if (!token) {
        return next(new Error('AUTHENTICATION_REQUIRED'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) return next(new Error('INVALID_IDENTITY'));
      if (user.isBanned) {
        await logSecurityEvent('SOCKET_UNAUTHORIZED', 'critical', user._id, { ip: socket.handshake.address, headers: socket.handshake.headers }, { reason: 'Banned user attempted socket connection' });
        return next(new Error('ACCOUNT_SUSPENDED'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('AUTH_FAILED'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`[SOCKET] Secured connection: ${socket.id} (User: ${socket.user.institutionalEmail})`);
    
    // Private personal room for direct notifications
    socket.join(`user:${socket.user._id}`);

    // FIX 07: Authorized Room Joining
    socket.on('joinProject', async (projectId) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          return socket.emit('joinProject:error', { code: 'INVALID_ID' });
        }

        const project = await Project.findById(projectId);
        if (!project) return socket.emit('joinProject:error', { code: 'NOT_FOUND' });

        const isCollaborator = project.collaborators.some(id => id.toString() === socket.user._id.toString());
        const isOwner = project.ownerId.toString() === socket.user._id.toString();
        const isStakeholderVisible = project.state === 'CERTIFIED' && socket.user.role === 'stakeholder';

        if (isOwner || isCollaborator || isStakeholderVisible || socket.user.role === 'admin') {
          socket.join(`project:${projectId}`);
          socket.emit('joinProject:success', { projectId });
        } else {
          // Log unauthorized attempt to traverse project rooms
          await logSecurityEvent('SOCKET_UNAUTHORIZED', 'warn', socket.user._id, { ip: socket.handshake.address, headers: socket.handshake.headers }, { 
            action: 'ROOM_ACCESS_DENIED',
            targetProject: projectId 
          });
          socket.emit('joinProject:error', { code: 'FORBIDDEN' });
        }
      } catch (err) {
        socket.emit('joinProject:error', { code: 'INTERNAL_ERROR' });
      }
    });

    socket.on('leaveProject', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`[SOCKET] Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io server not ready');
  return io;
};

module.exports = { initSocket, getIO };
