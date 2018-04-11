import {Router} from 'express';
import {
  joiFailurePrettier,
  decodeToken
} from '../../lib/common_functions';
import Projects from '../../models/projects';
import Photos from '../../models/photos';
import Medias from '../../models/medias';
import * as Joi from 'joi';

const projectRoute = Router();

projectRoute.post('/', async (req, res) => {
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
        name: Joi.string().required()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }
    const nameCheck = await Projects.findOne({createdBy: userDetails._id, name: req.body.name});
    if (nameCheck) {
      throw "This project name has already been used."
    }
    req.body["createdBy"] = userDetails._id;
    const projectToSave = new Projects(req.body);
    const savedProject = await projectToSave.save();
    res.send({statusCode: 200, data: savedProject});
  } catch (err) {
    console.warn(err);
    res.status(400).json({statusCode: 400, error: err});
  }
});

projectRoute.post('/photo', async (req, res) => {
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
        projectId: Joi.string().length(24).required(),
        media: Joi.string().length(24).required(),
        caption: Joi.string().optional()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }

    const mediaDetails = await Medias.findOne({_id: req.body.media}, {_id: 0, uploadedBy: 0, __v: 0, createdAt: 0, updatedAt: 0});
    if(!mediaDetails){
      throw "Please select valid media file.";
    }

    const projectDetails = await Projects.findOne({_id: req.body.projectId});
    if(!projectDetails){
      throw "Please select valid project.";
    }
    const photoToSave = {
      projectId : req.body.projectId,
      caption : req.body.caption || "",
      media : mediaDetails
    };
    console.log( "photoToSave : ", photoToSave );
    const photoObj = new Photos(photoToSave);
    const savedPhoto = await photoObj.save();
    res.send({statusCode: 200, data: savedPhoto});
  } catch (err) {
    console.warn(err);
    res.status(400).json({statusCode: 400, error: err});
  }
});

projectRoute.get('/', async (req, res) => {
  try {
    let userDetails;
    try {
      userDetails = await decodeToken(req.headers['access-token']);
    } catch (e) {
      throw 'Unauthorized Access. Please login.';
    }
    const ret = Joi.validate(
      req.params,
      Joi.object({
        projectId: Joi.string().length(24).allow('').optional(),
        search: Joi.string().allow('').optional(),
        skip: Joi.number().optional(),
        limit: Joi.number().optional()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }

    let criteria = {
      createdBy: userDetails._id
    };
    if(!userDetails.isPhotographer){
      delete criteria.createdBy;
      criteria["client"] = userDetails._id;
    }
    if(req.params.projectId){
      criteria["_id"] = req.params.projectId;
    }
    if(req.params.search){
      criteria["$text"] = {$search: req.params.search};
    }
    let options = {
      limit : req.params.limit || 20
    };
    if(req.params.skip){
      options["skip"] = req.params.skip
    }
    const projects = Projects.find(criteria, {}, options);
    res.send({statusCode: 200, data: projects});
  } catch (err) {
    console.warn(err);
    res.status(400).json({statusCode: 400, error: err});
  }
});

export default projectRoute;
