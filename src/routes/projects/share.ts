import {Router} from 'express';
import {
  joiFailurePrettier,
  decodeToken
} from '../../lib/common_functions';
import {TEMPLATES} from '../../constants';
import Projects from '../../models/projects';
import Users from '../../models/users';
import * as Joi from 'joi';
import {sendMessage, sendEmail} from '../../lib/notification_manager';

const shareRoute = Router();

shareRoute.post('/', async (req, res) => {
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
        project: Joi.string().length(24).required()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }

    const projectDetails = await Projects.findOne({_id: req.body.project});
    if (!projectDetails) {
      throw "Please select a valid project."
    }

    let shareDetails = {
      phoneNumber: (projectDetails.clientContactDetails && projectDetails.clientContactDetails.phoneNumber) || "",
      countryCode: (projectDetails.clientContactDetails && projectDetails.clientContactDetails.countryCode) || "",
      email: (projectDetails.clientContactDetails && projectDetails.clientContactDetails.email) || "",
      phoneTemplate: "PHONE_SHARE_WITH_PHOTOGRAPHER",
      emailTemplate: "EMAIL_SHARE_WITH_PHOTOGRAPHER"
    };

    if(userDetails.isPhotographer){
      // share with client
      if(projectDetails.client){
        const clientDetails = await Users.findOne({_id: projectDetails.client});
        shareDetails.phoneNumber = clientDetails.phone.phoneNumber;
        shareDetails.countryCode = clientDetails.phone.countryCode;
        shareDetails.email = clientDetails.phone.email;
      }
      shareDetails.phoneTemplate = "PHONE_SHARE_WITH_CLIENT";
      shareDetails.emailTemplate = "EMAIL_SHARE_WITH_CLIENT";
    }
    else{
      // share with photographer
      const photographerDetails = await Users.findOne({_id: projectDetails.createdBy});
      shareDetails.phoneNumber = photographerDetails.phone.phoneNumber;
      shareDetails.countryCode = photographerDetails.phone.countryCode;
      shareDetails.email = photographerDetails.phone.email;
    }

    sendMessage(
      TEMPLATES[shareDetails.phoneTemplate],
      shareDetails.countryCode + shareDetails.phoneNumber,
      {
        referralCode: projectDetails.referralCode
      }
    );
    sendEmail(
      TEMPLATES[shareDetails.emailTemplate],
      shareDetails.email,
      {
        referralCode: projectDetails.referralCode
      }
    );
    res.send({statusCode: 200, data: {}, message: "Shared successfully."});
  } catch (err) {
    console.warn(err);
    res.status(400).json({statusCode: 400, error: err});
  }
});

export default shareRoute;
