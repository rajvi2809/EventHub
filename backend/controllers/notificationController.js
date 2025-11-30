const Notification = require('../models/Notification');

// Get notifications for current user
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const query = { user: req.user.id };
    const notifications = await Notification.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.countDocuments(query);

    res.status(200).json({ success: true, count: notifications.length, total, notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error getting notifications' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (notif.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    notif.read = true;
    await notif.save();
    res.status(200).json({ success: true, notification: notif });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Server error marking notification' });
  }
};

module.exports = { getNotifications, markAsRead };
