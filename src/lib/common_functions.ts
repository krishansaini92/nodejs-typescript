import handlebars from 'handlebars';
import * as jwt from 'jsonwebtoken';
import { SERVER } from '../constants';
import Users from '../models/users';
import * as bcrypt from 'bcryptjs';

const tokenExpiryTime = 720 * 60 * 60;

export const joiFailurePrettier = (error) => {
  try {
    console.log(error.error.details[0].message);
    let customErrorMessage = '';
    if (error.error.details[0].message.indexOf('[') > -1) {
      customErrorMessage = error.error.details[0].message.substr(
        error.error.details[0].message.indexOf('[')
      );
    } else {
      customErrorMessage = error.error.details[0].message;
    }
    customErrorMessage = customErrorMessage.replace(/"/g, '');
    customErrorMessage = customErrorMessage.replace('[', '');
    customErrorMessage = customErrorMessage.replace(']', '');
    return customErrorMessage;
  } catch (err) {
    throw err;
  }
};

export const appendVariablesInTemplate = async (template, variables) => {
  try {
    let handlebarTemplate = await handlebars.compile(template);
    console.log(template, variables, handlebarTemplate);
    return await handlebarTemplate(variables);
  } catch (err) {
    throw err;
  }
};

export const decodeToken = async (token) => {
  try {
    const decodedId = await jwt.verify(token, SERVER.JWT_SECRET);
    return await Users.findOne({ _id: decodedId.id });
  } catch (err) {
    throw err;
  }
};

export const createToken = async (id) => {
  try {
    return await jwt.sign(
      {
        id: id,
        iat: Math.floor(Date.now() / 1000) - 30
      },
      SERVER.JWT_SECRET,
      { expiresIn: tokenExpiryTime }
    );
  } catch (err) {
    throw err;
  }
};

export const encryptPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (e) {
    throw e;
  }
};
