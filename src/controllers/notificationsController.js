const Notification = require('../models/Notification');
const { success, error } = require('../utils/apiResponse');

const getTenantNotificationModel = (req) => req.db.model('Notification', Notification.schema);

const getNotifications = async (req, res) => {
  try {
    const TenantNotification = getTenantNotificationModel(req);
    const { unreadOnly = false, limit = 20, page = 1 } = req.query;

    const filter = {};
    if (unreadOnly === 'true') filter.isRead = false;

    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      TenantNotification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      TenantNotification.countDocuments(filter),
    ]);

    const unreadCount = await TenantNotification.countDocuments({ isRead: false });

    return success(res, { notifications, total, unreadCount });
  } catch (err) {
    console.error('[NotificationsController] getNotifications error:', err.message);
    return error(res, 'Falha ao buscar notificações.', 500);
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const TenantNotification = getTenantNotificationModel(req);

    const notif = await TenantNotification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    if (!notif) return error(res, 'Notificação não encontrada.', 404);

    return success(res, { notif });
  } catch (err) {
    console.error('[NotificationsController] markAsRead error:', err.message);
    return error(res, 'Falha ao marcar notificação.', 500);
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const TenantNotification = getTenantNotificationModel(req);
    await TenantNotification.updateMany({ isRead: false }, { isRead: true });
    return success(res, { message: 'Todas as notificações marcadas como lidas.' });
  } catch (err) {
    console.error('[NotificationsController] markAllAsRead error:', err.message);
    return error(res, 'Falha ao marcar notificações.', 500);
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const TenantNotification = getTenantNotificationModel(req);

    await TenantNotification.findByIdAndDelete(id);
    return success(res, { message: 'Notificação deletada.' });
  } catch (err) {
    console.error('[NotificationsController] deleteNotification error:', err.message);
    return error(res, 'Falha ao deletar notificação.', 500);
  }
};

const createNotification = async (tenantDb, data) => {
  try {
    const TenantNotification = tenantDb.model('Notification', Notification.schema);
    const notif = await TenantNotification.create(data);
    return notif;
  } catch (err) {
    console.error('[NotificationsController] createNotification error:', err.message);
    return null;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
};
