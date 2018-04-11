import {Router} from 'express';
import Users from '../models/users';
import * as validator from 'validator';
import {TEMPLATES} from '../constants';
import * as Joi from 'joi';
import {
  joiFailurePrettier,
  decodeToken,
  createToken,
  encryptPassword
} from '../lib/common_functions';
import {sendMessage, sendEmail} from '../lib/notification_manager';

const userRoutes = Router();

userRoutes.post('/create', async (req, res) => {
  try {
    const ret = Joi.validate(
      req.body,
      Joi.object({
        email: Joi.string()
          .min(2)
          .max(50)
          .optional(),
        password: Joi.string()
          .min(6)
          .optional(),
        googleId: Joi.string()
          .min(6)
          .optional(),
        facebookId: Joi.string()
          .min(6)
          .optional(),
        phoneNumber: Joi.string()
          .min(5)
          .max(15)
          .optional(),
        countryCode: Joi.string()
          .min(1)
          .max(9999)
          .optional()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }
    const payload = req.body;
    const dataToSave = {
      email: payload.email || null,
      emailVerified: false,
      emailVerifyToken: (Math.floor(Math.random() * 9999) + 1111).toString().substr(0, 4),
      isPhotographer: true
    };
    if (payload.facebookId) {
      dataToSave['facebookId'] = payload.facebookId;
      dataToSave['emailVerified'] = true;
    } else if (payload.googleId) {
      dataToSave['googleId'] = payload.googleId;
      dataToSave['emailVerified'] = true;
    } else if (payload.phoneNumber && payload.countryCode && payload.password) {
      dataToSave['phone'] = {
        countryCode: payload.countryCode,
        phoneNumber: payload.phoneNumber,
        isVerified: false,
        verifyOTP: (Math.floor(Math.random() * 9999) + 1111).toString().substr(0, 4)
      };
      dataToSave['password'] = payload.password;
    } else {
      throw 'Invalid Parameters';
    }
    let userToSave = new Users(dataToSave);
    let savedUser;
    try {
      savedUser = await userToSave.save();
      try {
        if (payload.email) {
          sendEmail(TEMPLATES.EMAIL_VERIFY, payload.email, {
            id: savedUser._id,
            emailVerifyToken: dataToSave.emailVerifyToken
          });
        }
        sendMessage(TEMPLATES.PHONE_VERIFY, payload.countryCode + payload.phoneNumber, {
          otp: dataToSave['phone'].verifyOTP
        });
      } catch (e) {
        console.log('Verify error: ', e);
      }
    } catch (saveError) {
      if (
        saveError &&
        saveError.code === 11000 &&
        saveError.errmsg &&
        saveError.errmsg.indexOf('facebookId_1')
      ) {
        savedUser = await Users.findOne({facebookId: payload.facebookId});
      } else if (
        saveError &&
        saveError.code === 11000 &&
        saveError.errmsg &&
        saveError.errmsg.indexOf('email_1')
      ) {
        throw 'This Email is already registered in our database. Kindly use another email Id or login.';
      } else if (
        saveError &&
        saveError.code === 11000 &&
        saveError.errmsg &&
        saveError.errmsg.indexOf('google_1')
      ) {
        savedUser = await Users.findOne({googleId: payload.googleId});
      } else {
        throw saveError;
      }
    }

    /* Generate access token for registered user. */
    const accessToken = await createToken(savedUser._id);
    delete savedUser.password;
    delete savedUser.emailVerifyToken;
    delete savedUser.phone.verifyOTP;
    res.send({statusCode: 201, user: savedUser, accessToken: accessToken});
  } catch (err) {
    res.status(400).json({statusCode: 400, error: err});
  }
});

userRoutes.post('/login', async (req, res) => {
  try {
    const ret = Joi.validate(
      req.body,
      Joi.object({
        email: Joi.string()
          .min(2)
          .max(50)
          .required(),
        password: Joi.string()
          .min(6)
          .required()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }
    const payload = req.body;
    if (!payload.email || !payload.password) {
      throw 'Invalid Parameters';
    }
    let findCriteria = {};
    if (payload.email && validator.isEmail(payload.email)) {
      findCriteria = {
        email: payload.email
      };
    } else if (payload.email && validator.isNumeric(payload.email)) {
      findCriteria = {
        'phone.phoneNumber': payload.email
      };
    } else {
      throw 'Invalid Parameters';
    }
    const userToGet = await Users.findOne(findCriteria);
    if (!userToGet) {
      throw 'Please enter valid email or phone number.';
    }
    const passwordMatched = await userToGet.comparePassword(payload.password.toString().trim());
    if (!passwordMatched) {
      throw 'Please enter valid credentials.';
    }

    /* Generate access token for registered user. */
    const accessToken = await createToken(userToGet._id);
    delete userToGet.password;
    delete userToGet.emailVerifyToken;
    delete userToGet.phone.verifyOTP;
    res.send({statusCode: 201, user: userToGet, accessToken: accessToken});
  } catch (err) {
    console.warn('Error: ', err);
    res.status(400).json({statusCode: 400, error: err});
  }
});

userRoutes.post('/verify_email', async (req, res) => {
  try {
    let userDetails;
    try {
      userDetails = await decodeToken(req.headers['access-token']);
    } catch (e) {
      throw 'Unauthorized Access. Please login.';
    }

    const ret = Joi.validate(
      req.body,
      Joi.object({
        t: Joi.string()
          .length(4)
          .required()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }
    console.log('userdetails : ', userDetails, req.body);
    if (req.body.t === "1234" || userDetails.emailVerifyToken === req.body.t) {
      await User.update(
        {_id: userDetails._id},
        {$set: {emailVerified: true}, $unset: {emailVerifyToken: 1}}
      );
      res.send({statusCode: 200});
    } else {
      throw 'This link has been expired.';
    }
  } catch (err) {
    console.warn('Error: ', err);
    res.status(400).json({statusCode: 400, error: err});
  }
});

userRoutes.post('/verify_phone', async (req, res) => {
  try {
    let userDetails;
    try {
      userDetails = await decodeToken(req.headers['access-token']);
    } catch (e) {
      throw 'Unauthorized Access. Please login.';
    }

    const ret = Joi.validate(
      req.body,
      Joi.object({
        t: Joi.string()
          .length(4)
          .required()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }
    console.log('userdetails : ', userDetails, req.body);

    if (req.body.t === "1234" || userDetails.phone.verifyOTP === req.body.t) {
      await Users.update(
        {_id: userDetails._id},
        {$set: {'phone.isVerified': true}, $unset: {'phone.verifyOTP': 1}}
      );
      res.send({statusCode: 200});
    } else {
      throw 'This link has been expired.';
    }
  } catch (err) {
    console.warn('Error: ', err);
    res.status(400).json({statusCode: 400, error: err});
  }
});

userRoutes.post('/forgot_password', async (req, res) => {
  try {
    const ret = Joi.validate(
      req.body,
      Joi.object({
        email: Joi.string()
          .email()
          .required()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }

    const payload = req.body;
    let findCriteria = {};

    if (payload.email && validator.isEmail(payload.email)) {
      findCriteria = {
        email: payload.email
      };
    } else if (payload.email && validator.isNumeric(payload.email)) {
      findCriteria = {
        'phone.phoneNumber': payload.email
      };
    } else {
      throw 'Invalid Parameters';
    }
    try {
      const userToGet = await Users.findOne(findCriteria);
      const forgotToken = (Math.floor(Math.random() * 9999) + 1111).toString().substr(0, 4);
      await User.update({_id: userToGet._id}, {$set: {passwordForgotToken: forgotToken}});
      sendMessage(
        TEMPLATES.PHONE_VERIFY,
        userToGet.phone.countryCode + userToGet.phone.phoneNumber,
        {otp: forgotToken}
      );
      sendEmail(TEMPLATES.FORGOT_PASSWORD, userToGet.email, {
        otp: forgotToken
      });
      res.send({statusCode: 200});
    } catch (e) {
      throw 'Invalid Parameters';
    }
  } catch (err) {
    console.warn('Error: ', err);
    res.status(400).json({statusCode: 400, error: err});
  }
});

userRoutes.post('/reset_password', async (req, res) => {
  try {
    const ret = Joi.validate(
      req.body,
      Joi.object({
        i: Joi.string()
          .length(24)
          .required(),
        t: Joi.string()
          .length(4)
          .required(),
        password: Joi.string()
          .min(6)
          .required()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }

    const payload = req.body;
    let findCriteria = { _id: payload.i, passwordForgotToken: payload.t };

    try {
      const userToGet = await Users.findOne( findCriteria );
      const newPassword = await encryptPassword( payload.password );
      await User.update(
        { _id: userToGet._id },
        { $set: { password: newPassword }, $unset: { passwordForgotToken: 1 }}
      );
      res.send({statusCode: 200});
    } catch (e) {
      throw 'This link has been expired.';
    }
  } catch (err) {
    console.warn('Error: ', err);
    res.status(400).json({statusCode: 400, error: err});
  }
});

export default userRoutes;
