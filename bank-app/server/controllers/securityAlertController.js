import SecurityAlert from '../models/SecurityAlert.js';
import User          from '../models/User.js';
import { createError }        from '../middleware/error.js';
import { createNotification } from '../utils/notify.js';
import { getIO }              from '../socket/index.js';

// ── User endpoints ────────────────────────────────────────────────

// GET /api/security-alerts/active
export async function getActiveAlerts(req, res, next) {
  try {
    const alerts = await SecurityAlert.find({ user: req.user._id, status: 'active' })
      .sort({ severity: -1, createdAt: -1 })
      .lean();
    return res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
}

// GET /api/security-alerts/:id
export async function getAlertById(req, res, next) {
  try {
    const alert = await SecurityAlert.findOne({ _id: req.params.id, user: req.user._id })
      .populate('createdBy', 'firstName lastName')
      .populate('resolvedBy', 'firstName lastName')
      .lean();
    if (!alert) return next(createError('Alert not found', 404));
    return res.json({ success: true, data: alert });
  } catch (err) { next(err); }
}

// ── Admin endpoints ───────────────────────────────────────────────

// GET /api/admin/security-alerts
export async function adminListAlerts(req, res, next) {
  try {
    const { status, userId, severity } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (userId)   filter.user     = userId;
    if (severity) filter.severity = severity;

    const alerts = await SecurityAlert.find(filter)
      .sort({ createdAt: -1 })
      .populate('user',       'firstName lastName email')
      .populate('createdBy',  'firstName lastName')
      .populate('resolvedBy', 'firstName lastName')
      .lean();

    return res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
}

// GET /api/admin/security-alerts/:id
export async function adminGetAlert(req, res, next) {
  try {
    const alert = await SecurityAlert.findById(req.params.id)
      .populate('user',       'firstName lastName email')
      .populate('createdBy',  'firstName lastName')
      .populate('resolvedBy', 'firstName lastName')
      .lean();
    if (!alert) return next(createError('Alert not found', 404));
    return res.json({ success: true, data: alert });
  } catch (err) { next(err); }
}

// POST /api/admin/security-alerts
export async function adminCreateAlert(req, res, next) {
  try {
    const { userId, alertType, title, message, severity, restrictions, requiresChatResolution } = req.body;

    if (!userId || !title || !message) {
      return next(createError('userId, title, and message are required', 400));
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return next(createError('User not found', 404));

    const alert = await SecurityAlert.create({
      user:                   userId,
      alertType:              alertType || 'custom',
      title,
      message,
      severity:               severity  || 'medium',
      restrictions:           restrictions || {},
      requiresChatResolution: requiresChatResolution !== false,
      status:                 'active',
      createdBy:              req.user._id,
    });

    // Push real-time event to user
    const io = getIO();
    if (io) {
      io.to(`user:${String(userId)}`).emit('security:alert:new', {
        alertId:  String(alert._id),
        severity: alert.severity,
        title:    alert.title,
        message:  alert.message,
      });
    }

    createNotification({
      userId,
      title:    `Security Alert: ${title}`,
      message,
      type:     severity === 'critical' ? 'error' : 'warning',
      category: 'security',
    }).catch(() => {});

    const populated = await SecurityAlert.findById(alert._id)
      .populate('user',      'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .lean();

    return res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
}

// PATCH /api/admin/security-alerts/:id
export async function adminUpdateAlert(req, res, next) {
  try {
    const alert = await SecurityAlert.findById(req.params.id);
    if (!alert) return next(createError('Alert not found', 404));

    const { title, message, severity, alertType, restrictions, requiresChatResolution } = req.body;

    if (title)   alert.title   = title;
    if (message) alert.message = message;
    if (severity)  alert.severity  = severity;
    if (alertType) alert.alertType = alertType;
    if (restrictions) {
      alert.restrictions = { ...alert.restrictions.toObject(), ...restrictions };
    }
    if (typeof requiresChatResolution === 'boolean') {
      alert.requiresChatResolution = requiresChatResolution;
    }

    await alert.save();

    const updated = await SecurityAlert.findById(alert._id)
      .populate('user',      'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .lean();

    return res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

// POST /api/admin/security-alerts/:id/activate
export async function adminActivateAlert(req, res, next) {
  try {
    const alert = await SecurityAlert.findByIdAndUpdate(
      req.params.id, { status: 'active' }, { new: true }
    ).populate('user', 'firstName lastName email').lean();

    if (!alert) return next(createError('Alert not found', 404));

    const io = getIO();
    if (io) {
      io.to(`user:${String(alert.user._id)}`).emit('security:alert:new', {
        alertId:  String(alert._id),
        severity: alert.severity,
        title:    alert.title,
        message:  alert.message,
      });
    }

    return res.json({ success: true, data: alert });
  } catch (err) { next(err); }
}

// POST /api/admin/security-alerts/:id/deactivate
export async function adminDeactivateAlert(req, res, next) {
  try {
    const alert = await SecurityAlert.findByIdAndUpdate(
      req.params.id, { status: 'inactive' }, { new: true }
    ).populate('user', 'firstName lastName email').lean();

    if (!alert) return next(createError('Alert not found', 404));

    const io = getIO();
    if (io) {
      io.to(`user:${String(alert.user._id)}`).emit('security:alert:removed', {
        alertId: String(alert._id),
      });
    }

    return res.json({ success: true, data: alert });
  } catch (err) { next(err); }
}

// POST /api/admin/security-alerts/:id/resolve
export async function adminResolveAlert(req, res, next) {
  try {
    const { resolutionNotes } = req.body;

    const alert = await SecurityAlert.findByIdAndUpdate(
      req.params.id,
      {
        status:          'resolved',
        resolutionNotes: resolutionNotes || '',
        resolvedBy:      req.user._id,
        resolvedAt:      new Date(),
      },
      { new: true }
    ).populate('user', 'firstName lastName email').lean();

    if (!alert) return next(createError('Alert not found', 404));

    const io = getIO();
    if (io) {
      io.to(`user:${String(alert.user._id)}`).emit('security:alert:removed', {
        alertId: String(alert._id),
      });
    }

    createNotification({
      userId:   alert.user._id,
      title:    'Security Alert Resolved',
      message:  `Your security concern "${alert.title}" has been reviewed and resolved by our team.`,
      type:     'success',
      category: 'security',
    }).catch(() => {});

    return res.json({ success: true, data: alert });
  } catch (err) { next(err); }
}
