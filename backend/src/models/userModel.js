import mongoose from 'mongoose';
import slugify from 'slugify';
import validator from 'validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name!'],
    },
    slug: String,
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      default: '',
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'creator', 'admin', 'usher'],
      default: 'user',
      select: false,
    },
    // The bootstrap administrator, created by scripts/seed-admin.js. Marked so the role
    // endpoint can refuse to demote them: an ordinary admin demoting the last remaining
    // admin would leave nobody able to grant the role back, locking the platform out of its
    // own administration permanently. Never settable through the API.
    isRootAdmin: {
      type: Boolean,
      default: false,
      select: false,
    },
    // Where this organiser's ticket revenue is settled. Present only once they have
    // completed payout onboarding; until then their paid events cannot sell tickets, which
    // is deliberate - see bookingService.buildCheckoutConfig.
    //
    // **Deliberately NOT stored: the bank account number.** Paystack holds it; we keep only
    // the opaque subaccount code needed to route the split, plus the last four digits and
    // the resolved account name so the organiser can recognise which account they connected.
    // Storing full account numbers would create a payment-data liability with no
    // corresponding capability - nothing in this system can act on one.
    payout: {
      // Paystack subaccount code, e.g. ACCT_xxxxxxxxxx. The only field the money path reads.
      subaccountCode: { type: String, select: false },
      bankName: { type: String },
      bankCode: { type: String },
      accountNameMasked: { type: String },
      accountNumberLast4: { type: String },
      // The platform percentage in force when this account was connected, recorded so a
      // later change to PLATFORM_FEE_PERCENT is visible as a change rather than silently
      // repricing historical arrangements.
      platformFeePercent: { type: Number },
      connectedAt: { type: Date },
    },
    // Events an usher is authorised to scan/admit for. Only meaningful when role === 'usher';
    // door check-in is scoped to these events (enforced in Phase 2).
    assignedEvents: {
      type: [{ type: mongoose.Schema.ObjectId, ref: 'Event' }],
      default: undefined,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // This only works on .create and .save
        validator: function (val) {
          return val === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetTokenExpires: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
userSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 14);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWT_TIMESTAMP) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime()) / 1000;
    return JWT_TIMESTAMP < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires in 10 minutes
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
