const Notification = require('../models/notificationModel');

// Create a new notification
exports.createNotification = async (req, res, next) => {
  try {
    const notification = await Notification.create({
      message: req.body.message,
    });
    res.status(201).json({
      status: 'success',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// Get all notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ hidden: { $ne: true } })
      .sort({ createdAt: -1 });
      
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.status(200).json({
      status: 'success',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

//deleting notifications
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found',
      });
    }
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

exports.hideNotification = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { hidden: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};
