import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'support-agent'],
      default: 'user',
    },
    accounts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BankAccount',
      },
    ],

    // ── Admin 2FA PIN ─────────────────────────────────────────────
    pin2FA: {
      type:    String,
      select:  false,
      default: null,
    },
    pin2FAAttempts: {
      type:    Number,
      default: 0,
    },
    pin2FALockedUntil: {
      type:    Date,
      default: null,
    },
    pin2FASet: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Hash password before save ─────────────────────────────────────
// Mongoose 8+: async pre-hooks resolve via promise — do not pass next
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Hash 2FA PIN before save (if plain-text value set) ────────────
userSchema.pre('save', async function () {
  if (!this.isModified('pin2FA') || !this.pin2FA) return;
  if (this.pin2FA.startsWith('$2')) return; // already a bcrypt hash
  const salt = await bcrypt.genSalt(12);
  this.pin2FA    = await bcrypt.hash(this.pin2FA, salt);
  this.pin2FASet = true;
});

// ── Instance method: verify a candidate password ──────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: verify a candidate PIN ───────────────────────
userSchema.methods.comparePin = async function (candidatePin) {
  if (!this.pin2FA) return false;
  return bcrypt.compare(candidatePin, this.pin2FA);
};

const User = mongoose.model('User', userSchema);

export default User;
