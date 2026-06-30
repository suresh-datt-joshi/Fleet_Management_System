import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../constants/roles.js';

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const otpSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    type: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: true,
    },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.DISPATCHER,
    },
    avatar: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    otp: {
      type: otpSchema,
      default: null,
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.otp;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.index({ role: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ createdAt: -1 });

userSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.softDelete = function softDelete() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

userSchema.query.notDeleted = function notDeleted() {
  return this.where({ isDeleted: false });
};

const User = mongoose.model('User', userSchema);

export default User;
