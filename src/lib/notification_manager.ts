import * as plivo from 'plivo';
import * as nodemailer from 'nodemailer';
import { TEMPLATES } from '../constants';
import { appendVariablesInTemplate } from '../lib/common_functions';

const poolConfig = {
  host: 'smtpout.asia.secureserver.net',
  port: 465,
  secure: true, // use TLS
  auth: {
    user: 'donotreply@archibuddy.com',
    pass: '5H4G2JJJ@581W_S'
  }
};
const transporter = nodemailer.createTransport(poolConfig);

const plivoClient = plivo.RestAPI({
  authId: 'MANGFJMWIXNWU3NZQ0YT',
  authToken: 'N2ViM2I0MDEwNzA3ZGE4MmZlM2NmMDNhYjY5YmE0'
});

export const sendMessage = async function(template, to, variables) {
  try {
    const message = await appendVariablesInTemplate(template, variables);
    let params = {
      src: '+918566829154',
      dst: to,
      text: message
    };
    console.log(await plivoClient.send_message(params));
  } catch (e) {
    console.log('Log: ', e);
  }
};

export const sendEmail = async function(template, to, variables) {
  try {
    const result = await appendVariablesInTemplate(template.BODY, variables);
    console.log(to, template.SUBJECT, result);
    let mailOptions = {
      from: 'Brand<donotreply@brand.com>', // sender address
      to: to,
      subject: template.SUBJECT, // Subject line
      html: result // html body
    };
    // send mail with defined transport object
    console.log(await transporter.sendMail(mailOptions));
    return true;
  } catch (e) {
    console.log('Log: ', e);
  }
};
