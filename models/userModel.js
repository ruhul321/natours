const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true,
    unique: true,
    minlenght: [3, 'A user name must be equal to 3 or more characters'],
    maxlength: [40, 'A user name must be less then or equal to 40 characters'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'A user must have an email'],
    lowercase: true,
    validate: [validator.isEmail, 'Please use correct email id'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guide', 'lead-guide'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlenght: [8, 'A password must be equal to 8 or more characters'],
    select: false, //this password field will not show in response
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //This only works on CREATE and SAVE!!
      validator: function (el) {
        return el === this.password;
      },
      message: (props) => `${props.value} is not matched with password`,
    },
  },
  passwordChangedAt: Date,
  PasswordResetToken: String,
  PasswordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //Only run this below line if password is actually modified
  if (!this.isModified('password')) return next();
  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  //Delete the passwordConfirm field
  this.passwordConfirm = undefined; //we are removing 2nd password to save one password only in DB it was just to validate user
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //subtracting 1 sec bcz document save will take time by mongoose then to create token
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//this is instance method we can use on any document to compare the password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword); //userpassword will be the hashed password
};
//this is also instance method to verify JWT after password changed
userSchema.methods.changedPasswordAfterJWT = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000, // to get time in secs so dividing by 1000
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  //False means password not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.PasswordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.PasswordResetExpires = Date.now() + 10 * 60 * 1000;
  //console.log({ resetToken }, this.passwordResetToken);

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
