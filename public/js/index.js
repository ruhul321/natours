/* eslint-disable */
import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { signup } from './signup';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alerts';

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signUpForm = document.querySelector('.form--signup');
const logoutButton = document.querySelector('.nav__el--logout');
const userDataFrom = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

//DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
  document.body.scrollTop = document.documentElement.scrollTop = 0;
}

const checkpassword = () => {
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;
  if (password !== passwordConfirm) {
    document.querySelector('.password_check').textContent =
      'Passwords do not match';
    document.querySelector('.btn--green').disabled = true;
    document.querySelector('.btn--green').style.pointerEvents = 'none';
  } else {
    document.querySelector('.password_check').textContent = '';
    document.querySelector('.btn--green').disabled = false;
    document.querySelector('.btn--green').style.pointerEvents = 'auto';
    // passwordConfirm.setCustomValidity('Passwords do not match');
  }
};

if (signUpForm)
  document
    .getElementById('passwordConfirm')
    .addEventListener('input', checkpassword);
signUpForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;
  signup(name, email, password, passwordConfirm);
});

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (logoutButton) logoutButton.addEventListener('click', logout);

if (userDataFrom)
  userDataFrom.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    // console.log(form);

    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save--password').innerHTML = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );

    document.querySelector('.btn--save--password').innerHTML = 'Save password';
    //After updating passwords set fields to empty again
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset; //bookBtn.dataset.tourId;
    bookTour(tourId);
    // e.target.textContent = 'Book tour now!';
  });

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 10);
