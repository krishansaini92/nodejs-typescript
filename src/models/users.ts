import { Schema, model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

const Users = new Schema(
  {
    name: {
      first_name: { type: String, index: true },
      last_name: { type: String, index: true }
    },
    phone: {
      countryCode: { type: String, index: true },
      phoneNumber: { type: String, index: true, unique: true, sparse: true },
      isVerified: { type: Boolean, default: false },
      verifyOTP: { type: String }
    },
    email: { type: String, email: true, unique: true, index: true },
    location: {
      cityName: { type: String, index: true },
      latLong: [{ type: Number }]
    },
    isPhotographer: { type: Boolean, default: false },
    password: { type: String },
    facebookId: { type: String, unique: true, sparse: true },
    googleId: { type: String, unique: true, sparse: true },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String },
    passwordForgotToken: { type: String }
  },
  { timestamps: true }
);
Users.index({ email: 1, googleId: 1, facebookId: 1 }, { unique: true });

Users.pre('save', function(next) {
  bcrypt.hash(this.password, 10, (err, hash) => {
    this.password = hash;
    next();
  });
});

Users.pre('update', function(next) {
  bcrypt.hash(this.password, 10, (err, hash) => {
    this.password = hash;
    next();
  });
});

Users.methods.comparePassword = function(candidatePassword: string): Promise<boolean> {
  let password = this.password;
  console.log('this password: ', password);
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, password, (err, success) => {
      if (err) return reject(err);
      return resolve(success);
    });
  });
};

export default model('Users', Users);
