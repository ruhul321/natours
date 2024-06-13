const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1.GLOBAL MIDDLEWARES
//Middleware to load static files without routes in browser
app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet()); //Set security HTTP headers

//Development logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit request from Same IP. 100 reqs from same IP in 1 hour(millisecs)
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, Please try again in an hour',
});
app.use('/api', limiter);

//Middleware to get request body(Body parser)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitization against NOSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS attack
app.use(xss());

//protect against HTTP Parameter Pollution attacks
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

//Just for testing
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.get('host'));
  next();
});

//2. ROUTE HANDLERS
//Shifted to respective route file the handlers
//app.get('/api/v1/tours', getAllTours); OR app.route('/api/v1/tours').get(getAllTours).post(createTours) as we can chain other HTTP methods also for same route;

//3. ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Middleware to handle all not defined routes and it should be kept last if execution reaches here means no routes has been matched.
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} route on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(
    new AppError(`Can't find ${req.originalUrl} route on this server!`, 404),
  );
});

//Error Handling Middleware to handle all errors at one central place
app.use(globalErrorHandler);

module.exports = app;
