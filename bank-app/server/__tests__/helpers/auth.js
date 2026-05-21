import { generateToken } from '../../utils/generateToken.js';

export function tokenFor(user) {
  return `Bearer ${generateToken(user._id)}`;
}

export function adminTokenFor(admin) {
  return tokenFor(admin);
}
