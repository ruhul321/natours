/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51PPVdyIFion8q8VtI55b97Pno7jqGBN8vdS6hKhcldWvkZOg8wowbYoVHcb8yzxybluEaAPIoVtFbJ7ikHHb2Job00EtqiGEEg',
);
export const bookTour = async (tourID) => {
  try {
    //1. Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourID}`);
    //console.log(session);

    //2. Create the checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err.response.data.message);
  }
};
