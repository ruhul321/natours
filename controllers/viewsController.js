const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert =
      "Your booking was successful. Please check your email for confirmation. If your booking doesn't show up immediately, please come back later.";
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  //1. Get tour data from collection
  const tours = await Tour.find();

  //2. Build template

  //3. Render that template using tour data from setp 1
  res
    .status(200)
    // .set(
    //   'Content-Security-Policy',
    //   "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;",
    // )
    .render('overview', { title: 'All tours', tours });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1. Get the date for the requested tour(including reviews & tour guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating',
  });
  if (!tour) {
    // console.log(req.params.slug);
    return next(
      new AppError(`There is no tour with the name ${req.params.slug}.`, 404),
    );
  }

  //2. Build template
  //3. Render template using data from step 1
  res
    .status(200)
    // .set(
    //   'Content-Security-Policy',
    //   "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;",
    // )
    .render('tour', { title: `${tour.name} Tour`, tour });
});
exports.getLoginForm = (req, res) => {
  res.status(200).render('login', { title: 'Log in to your account' });
};
exports.getSignUpForm = (req, res) => {
  res.status(200).render('signup', { title: 'Sign Up for New account' });
};
exports.getAccount = (req, res) => {
  res.status(200).render('account', { title: 'My account' });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //console.log(req.user);
  //1. Find all bookings
  //const bookings = factory.getAll(Booking);
  const bookings = await Booking.find({ user: req.user.id });
  //console.log(bookings);

  //2. Find all tours with the returned booking IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', { title: 'My Tours', tours });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  //console.log('UPDATING USER...', req.body);
  //console.log(req.user._id);
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  res.status(200).render('account', { title: 'My account', user: updatedUser });
});
