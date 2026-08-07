import * as authService from '../../services/authService.js';
import Email from '../../shared/utils/email.js';
import catchAsync from '../../shared/middleware/catchAsync.js';
import AppError from '../../shared/errors/AppError.js';

/**
 * Presentation layer for authentication.
 * Handles HTTP concerns only: cookies, headers, request parsing, response formatting.
 * All business logic is delegated to authService.
 */

const TOKEN_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Attaches the JWT as an HTTP-only cookie and sends the token + user in the response.
 */
const createSendToken = (user, statusCode, res) => {
  const token = authService.generateToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(Date.now() + TOKEN_COOKIE_MAX_AGE_MS),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

// ─── Route Handlers ────────────────────────────────────────────────────────────

export const signup = catchAsync(async (req, res) => {
  const newUser = await authService.signup({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  new Email(
    newUser,
    `${process.env.DEV_FRONTEND_URL}/my-profile`,
  ).sendWelcome();

  createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res) => {
  const user = await authService.login(req.body.email, req.body.password);
  createSendToken(user, 200, res);
});

export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { user, resetToken } = await authService.initiatePasswordReset(
    req.body.email,
  );

  const resetURL =
    process.env.NODE_ENV === 'production'
      ? `${process.env.PROD_FRONTEND_URL}/reset-password/?token=${resetToken}`
      : `${process.env.DEV_FRONTEND_URL}/reset-password/?token=${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({ status: 'success', message: 'Token sent to email' });
  } catch {
    await authService.clearPasswordResetToken(user);
    return next(
      new AppError(
        'There was an error sending the email. Try again later.',
        500,
      ),
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  await authService.resetPassword(
    req.params.token,
    req.body.password,
    req.body.passwordConfirm,
  );
  res
    .status(200)
    .json({ status: 'success', message: 'Password updated successfully' });
});

export const updatePassword = catchAsync(async (req, res, next) => {
  const user = await authService.updatePassword(
    req.user.id,
    req.body.currentPassword,
    req.body.password,
    req.body.passwordConfirm,
  );
  createSendToken(user, 200, res);
});

// ─── Middleware ─────────────────────────────────────────────────────────────────

/**
 * Protects routes by requiring a valid JWT. Sets req.user on success.
 */
export const protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to gain access.', 401),
    );
  }

  const currentUser = await authService.verifyAndGetUser(token);
  req.user = currentUser;
  next();
});

/**
 * Optionally identifies a logged-in user without blocking the request.
 * Sets req.user if a valid token is found; silently passes otherwise.
 */
export const isLoggedIn = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return next();

  try {
    const currentUser = await authService.verifyAndGetUser(token);
    req.user = currentUser;
  } catch {
    // Token invalid or expired - treat as unauthenticated
  }

  return next();
};

/**
 * Restricts a route to users with one of the specified roles.
 * Must be used after protect or isLoggedIn.
 */
export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403),
      );
    }
    next();
  };
