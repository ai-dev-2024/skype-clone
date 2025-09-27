import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { User as IUser } from '@skype-clone/shared';

export interface IUserDocument extends Omit<IUser, 'id'>, Document {
  password: string;
  refreshTokens: string[];
  generateAuthToken(): string;
  generateRefreshToken(): string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  removeRefreshToken(token: string): void;
}

const userSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username must be less than 20 characters']
  },
  firstName: {
    type: String,
    required: [true, 'Please provide a first name'],
    maxlength: [50, 'First name must be less than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Please provide a last name'],
    maxlength: [50, 'Last name must be less than 50 characters']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  publicKey: {
    type: String,
    default: ''
  },
  publicKeyFingerprint: {
    type: String,
    default: ''
  },
  refreshTokens: {
    type: [String],
    select: false,
    default: []
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Generate JWT token
userSchema.methods.generateAuthToken = function(): string {
  const secret: Secret = (process.env.JWT_SECRET || 'default-secret') as Secret;
  const expiresIn = (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'];

  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      username: this.username
    },
    secret,
    {
      expiresIn
    }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function(): string {
  const secret: Secret = (process.env.JWT_REFRESH_SECRET || 'default-refresh-secret') as Secret;
  const expiresIn = (process.env.JWT_REFRESH_EXPIRE || '30d') as SignOptions['expiresIn'];

  const refreshToken = jwt.sign(
    { id: this._id },
    secret,
    {
      expiresIn
    }
  );

  this.refreshTokens.push(refreshToken);
  return refreshToken;
};

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove refresh token
userSchema.methods.removeRefreshToken = function(token: string): void {
  this.refreshTokens = this.refreshTokens.filter((storedToken: string) => storedToken !== token);
};

export default mongoose.model<IUserDocument>('User', userSchema);
