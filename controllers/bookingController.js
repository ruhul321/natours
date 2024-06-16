const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1. Get the currently booked tour
  const tour = await Tour.findById(req.params.tourID);

  //2. Create the checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
            ],
          },
        },
        quantity: 1,
      },
    ],
  });

  //3. Send session as a response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //This is only temporary, bcz it is unsecure everyonce can make bookings without paying.
//   const { tour, user, price } = req.query;
//   if (!tour && !user && !price) return next();

//   await Booking.create({
//     tour,
//     user,
//     price,
//   });
//   res.redirect(
//     req.originalUrl.split('?')[0].replace('/my-tours/', '/my-tours'),
//   );
//   // console.log(req.originalUrl.split('?')[0].replace('/my-tours/', '/my-tours'));
// });
const createBookingCheckout = async (session) => {
  try {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;
    const price = session.data.object.amount_total / 100;
    await Booking.create({
      tour,
      user,
      price,
    });
  } catch (err) {
    console.log(`Booking error..${err}`);
  }
};

exports.webhookCheckout = catchAsync(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed')
    await createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
