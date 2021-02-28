import { RequestHandler, Response } from 'express';
import User from '../models/User';
import asyncHandler from 'express-async-handler';
import { ErrorResponse } from '../utils/ErrorResponse';
import { sendEmail } from '../utils/sendEmail';

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
export const register: RequestHandler = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login: RequestHandler = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});
// @desc    Get current logged in user
// @route   POST /api/v1/auth/me
// @access  Private
export const getMe: RequestHandler = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/auth/users/:id
// @access  Admin
export const deleteUser: RequestHandler = asyncHandler(
  async (req, res, next) => {
    // This is needed because otherwise you won't be able to get user.role
    const user = await User.findById(req.params.id);

    // Check if user is trying to delete himself, the check has to be done before you use findByIdAndDelete
    if (req.params.id === req.user.id) {
      return next(new ErrorResponse(`You can't delete yourself`, 401));
    }

    // Check if user exists
    if (!user) {
      return next(new ErrorResponse(`User doesn't exist`, 401));
    }

    // Check if user is another admin
    if (user.role === 'admin') {
      return next(new ErrorResponse(`You can not delete other admins`, 401));
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: `Deleted user with id of: ${req.params.id}`,
    });
  }
);
// @desc    Get all users
// @route   GET /api/v1/auth/users/
// @access  Admin
export const getUsers: RequestHandler = asyncHandler(async (req, res) => {
  const user = await User.find();

  res.status(200).json({
    success: true,
    numberOfUsers: user.length,
    data: user,
  });
});

// @desc    Get single user
// @route   GET /api/v1/auth/users/:id
// @access  Admin
export const getUser: RequestHandler = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  // If id format is valid but user doesn't exist
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({ sucess: true, data: user });
});
// @desc    Edit user (self)
// @route   PUT /api/v1/auth/me
// @access  Private
export const updateMe: RequestHandler = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ sucess: true, data: user });
});

// @desc    Edit user
// @route   PUT /api/v1/users/:id
// @access  Admin
export const updateUser: RequestHandler = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ sucess: true, data: user });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
export const forgotPassword: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    // Check is user exists
    if (!user) {
      return next(new ErrorResponse('There is no user with that email', 404));
    }
    // Get reset token
    let resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/auth/resetpassword/${resetToken}`;

    // Create message to pass, in actual frontend you want to put an actual link inside

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;
    // Sending email
    try {
      // Passing options
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message,
      });

      res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
      console.log(err);
      // If something goes wrong then delete the token and expire from dataabase
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

// Get token from model, create cookie and send response
const sendTokenResponse = (user: User, statusCode: number, res: Response) => {
  const token: string = user.getSignedJwtToken(); // jsonwebtoken
  const expireTime = (process.env.JWT_COOKIE_EXPIRE as unknown) as number;
  // Cookie options
  const options = {
    expires: new Date(Date.now() + expireTime * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: false,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  res.status(statusCode).cookie('token', token, options).json({
    succcess: true,
    token,
  });
};
