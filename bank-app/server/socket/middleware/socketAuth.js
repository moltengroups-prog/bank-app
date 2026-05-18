import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

export async function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Not authorized — no token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id firstName lastName email role');

    if (!user) {
      return next(new Error('Not authorized — account no longer exists'));
    }

    socket.user = user;
    next();
  } catch {
    next(new Error('Not authorized — invalid token'));
  }
}
