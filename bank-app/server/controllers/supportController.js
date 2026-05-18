import SupportConversation from '../models/SupportConversation.js';
import SupportMessage from '../models/SupportMessage.js';
import { createError } from '../middleware/error.js';
import { getIO } from '../socket/index.js';

// ── POST /api/support/conversations ───────────────────────────────
// Returns existing active/waiting conversation if one exists.
export async function startConversation(req, res, next) {
  try {
    const { source = 'live-chat', metadata = {} } = req.body;
    const userId = req.user._id;

    // Return existing open conversation rather than creating a duplicate
    const existing = await SupportConversation.findOne({
      user: userId,
      status: { $in: ['waiting', 'active'] },
    });

    if (existing) {
      return res.json({ success: true, data: { conversationId: existing._id }, resumed: true });
    }

    const conversation = await SupportConversation.create({
      user:     userId,
      source,
      metadata,
      status:   'waiting',
    });

    await SupportMessage.create({
      conversation: conversation._id,
      senderType:   'system',
      message:      'Conversation started. A specialist will be with you shortly.',
    });

    // Notify admins of the new conversation in real time
    const io = getIO();
    if (io) {
      io.to('admins').emit('admin:newSupportConversation', {
        id:           conversation._id,
        status:       conversation.status,
        source:       conversation.source,
        priority:     conversation.priority,
        lastMessageAt: conversation.lastMessageAt,
        user: {
          id:        req.user._id,
          firstName: req.user.firstName,
          lastName:  req.user.lastName,
          email:     req.user.email,
        },
      });
    }

    res.status(201).json({ success: true, data: { conversationId: conversation._id }, resumed: false });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/support/conversations/:id/message ───────────────────
export async function addMessage(req, res, next) {
  try {
    const { message } = req.body;
    if (!message?.trim()) return next(createError('Message is required', 400));

    const conversation = await SupportConversation.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });
    if (!conversation) return next(createError('Conversation not found', 404));
    if (conversation.status === 'closed') return next(createError('Conversation is closed', 400));

    const msg = await SupportMessage.create({
      conversation: conversation._id,
      sender:       req.user._id,
      senderType:   'user',
      message:      message.trim(),
    });

    await SupportConversation.findByIdAndUpdate(conversation._id, {
      lastMessageAt: new Date(),
    });

    const msgData = {
      id:         msg._id,
      senderType: msg.senderType,
      message:    msg.message,
      isRead:     msg.isRead,
      createdAt:  msg.createdAt,
      sender: {
        id:        req.user._id,
        firstName: req.user.firstName,
        lastName:  req.user.lastName,
        role:      req.user.role,
      },
    };

    // Broadcast to conversation room so admin sees it instantly
    const io = getIO();
    if (io) {
      io.to(`conversation:${conversation._id}`).emit('support:newMessage', msgData);
      io.to('admins').emit('support:conversationActivity', {
        conversationId: conversation._id,
        lastMessageAt:  new Date(),
      });
    }

    res.status(201).json({ success: true, data: msgData });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/support/conversations ────────────────────────────────
export async function getMyConversations(req, res, next) {
  try {
    const conversations = await SupportConversation.find({ user: req.user._id })
      .sort({ lastMessageAt: -1 })
      .limit(20);

    const data = conversations.map((c) => ({
      id:            c._id,
      status:        c.status,
      source:        c.source,
      priority:      c.priority,
      lastMessageAt: c.lastMessageAt,
      startedAt:     c.startedAt,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/support/conversations/:id/messages ───────────────────
export async function getConversationMessages(req, res, next) {
  try {
    const conversation = await SupportConversation.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });
    if (!conversation) return next(createError('Conversation not found', 404));

    const messages = await SupportMessage.find({ conversation: req.params.id })
      .sort({ createdAt: 1 })
      .populate('sender', 'firstName lastName role');

    const data = messages.map((m) => ({
      id:         m._id,
      senderType: m.senderType,
      message:    m.message,
      isRead:     m.isRead,
      createdAt:  m.createdAt,
      sender:     m.sender
        ? { id: m.sender._id, firstName: m.sender.firstName, lastName: m.sender.lastName, role: m.sender.role }
        : null,
    }));

    res.json({
      success: true,
      data,
      conversation: {
        id:       conversation._id,
        status:   conversation.status,
        source:   conversation.source,
        priority: conversation.priority,
      },
    });
  } catch (err) {
    next(err);
  }
}
