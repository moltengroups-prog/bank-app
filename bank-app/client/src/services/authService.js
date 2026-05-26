import { api } from './api';

export const authService = {
  login:     (email, password)      => api.post('/auth/login',      { email, password }),
  verifyOTP: (otpToken, code)       => api.post('/auth/otp/verify', { otpToken, code }),
  resendOTP: (otpToken)             => api.post('/auth/otp/resend', { otpToken }),
  register:  (data)                 => api.post('/auth/register',   data),
  getMe:     ()                     => api.get('/auth/me'),
  logout:    ()                     => api.post('/auth/logout'),
};
