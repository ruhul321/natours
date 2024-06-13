const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicatFieldsDB = (err) => {
  const message = `Duplicate field value: "${err.keyValue.name}". Please use another value.`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errormessage = Object.values(err.errors).map((val) => val.message);
  const message = `Invalid input data: ${errormessage.join('. ')}`;
  return new AppError(message, 400);
};
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again!', 401);
};
const handleJWTExpiredTokenError = () => {
  return new AppError('Your token has expired. Please log in agian.', 401);
};

const sendErrorDev = (req, err, res) => {
  //A. API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //B. RENDERED WEBSITE
  console.error('ERROR 🔥', err);
  return res
    .status(err.statusCode)
    .render('error', { title: 'Something went wrong!', msg: err.message });
};
const sendErrorProd = (req, err, res) => {
  //A. API
  if (req.originalUrl.startsWith('/api')) {
    //Operational error that we set by developers
    if (err.isoperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //Programming or unknown errors : send generic response to client
    console.error('ERROR 🔥', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again!',
    });
  }
  //B. RENDERED WEBSITE
  if (err.isoperational) {
    // console.log('Inside prod', err);
    return res
      .status(err.statusCode)
      .render('error', { title: 'Something went wrong!', msg: err.message });
  }
  //Programming or unknown errors : send generic response to client
  console.error('ERROR 🔥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later!',
  });
};
module.exports = (err, req, res, next) => {
  // console.error(process.env.NODE_ENV);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(req, err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }; //error.name ==== 'CastError' was not coming so used err.name === 'CastError'
    error.message = err.message;
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicatFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredTokenError();
    sendErrorProd(req, error, res);
  }
};
