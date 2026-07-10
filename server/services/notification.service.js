const NotificationEvent = require('../models/NotificationEvent.model');
const Project = require('../models/Project.model');
const logger = require('../utils/logger');

// Note: In a real production setup, io would be exported from a socket manager singleton.
// For now, we assume a globally accessible getter or passed-in instance.
let io;

const setIo = (socketIoInstance) => {
  io = socketIoInstance;
};

/**
 * Creates a notification for a specific user and emits via socket.
 */
const createNotification = async (userId, type, message, metadata = {}) => {
  try {
    const notification = await NotificationEvent.create({
      userId,
      type,
      message,
      metadata
    });

    if (io) {
      io.to(`user:${userId}`).emit('notification:new', { notification });
    }

    return notification;
  } catch (err) {
    logger.error('Error creating notification:', err);
    throw err;
  }
};

/**
 * Marks a notification as read.
 */
const markRead = async (notificationId, userId) => {
  return await NotificationEvent.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
};

/**
 * Fetches notifications for a user with pagination.
 */
const getUserNotifications = async (userId, limit = 20) => {
  return await NotificationEvent.find({ userId })
    .sort({ isRead: 1, createdAt: -1 })
    .limit(limit);
};

/**
 * Broadcasts a notification to all collaborators and the owner of a project.
 */
const broadcastToProject = async (projectId, type, message, metadata = {}) => {
  try {
    const project = await Project.findById(projectId).populate('collaborators');
    if (!project) return;

    const recipients = new Set([
      project.ownerId.toString(),
      ...project.collaborators.map(c => c._id.toString())
    ]);

    const notifications = await Promise.all(
      Array.from(recipients).map(userId => createNotification(userId, type, message, metadata))
    );

    return notifications;
  } catch (err) {
    logger.error('Error broadcasting to project:', err);
    throw err;
  }
};

module.exports = {
  setIo,
  createNotification,
  markRead,
  getUserNotifications,
  broadcastToProject
};
