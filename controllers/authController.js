const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000, //in milisecs
    ),
    secure: true,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; //just to hide password in response

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1. Check If email & password actually exits
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  //2. Check if user exits & password is correct
  const user = await User.findOne({ email }).select('+password'); //+ to include that field in result
  // console.log(user);
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email or password!', 401));
  }

  //3. if everything is ok, send token to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'Logged out', {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //1. Get the token and check if it exist
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // console.log(token);
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access', 401),
    );
  }
  //2. Validate the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded);

  //3. Check if user still exists in DB
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The user belonging to this token doesnot exist.', 401),
    );
  }
  //4. Check if user has changed password after token(JWT) was issued.
  if (freshUser.changedPasswordAfterJWT(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please login again.', 401),
    );
  }
  //Grant Access to Protected Route
  req.user = freshUser;
  //console.log(req.user);
  res.locals.user = freshUser; //pug template will get access to user from locals.user
  next();
});

//Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1. Validate the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );
      //2. Check if user still exists in DB
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      //3. Check if user has changed password after token(JWT) was issued.
      if (freshUser.changedPasswordAfterJWT(decoded.iat)) {
        return next();
      }
      //There is a logged in user
      res.locals.user = freshUser; //pug template will get access to user from locals.user
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrict = (...roles) => {
  return (req, res, next) => {
    //roles['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You donot have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  // console.log(user);
  if (!user) {
    return next(
      new AppError('There is no user with the given email address.', 404),
    );
  }
  //2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); //to save data to DB we used save on user documents

  //3. Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email.',
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.PasswordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  console.log(hashedToken);
  const user = await User.findOne({
    PasswordResetToken: hashedToken,
    PasswordResetExpires: { $gt: Date.now() },
  });

  //2. If token has not expired, and there is a user,Set a new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.PasswordResetToken = undefined;
  user.PasswordResetExpires = undefined;
  await user.save();

  //3. Update changedPasswordAt property for the current user
  user.passwordChangedAt = Date.now();

  //4. Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // console.log(req.user); we will get user from protect route then use here
  //1. Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // console.log(user);
  //2. check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  // //3.Both new and old password cannot be same
  // if (req.body.passwordCurrent === req.body.password) {
  //   return next(new AppError('Both old and new password cannot be same!', 400));
  // }

  //4. If so,update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //5. Log user in, and send JWT
  createSendToken(user, 200, res);
});
