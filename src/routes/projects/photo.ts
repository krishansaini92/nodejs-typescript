import { S3 } from '../../constants';
import { Router } from 'express';
import * as md5 from 'md5';
import * as AWS from 'aws-sdk';
import * as Joi from 'joi';
import Projects from '../../models/projects';
import Photos from '../../models/photos';
AWS.config.update({ accessKeyId: S3.ACCESS_KEY_ID, secretAccessKey: S3.SECRET_ACCESS_KEY });
import * as fs from 'fs';
import {
  joiFailurePrettier,
  decodeToken
} from '../../lib/common_functions';
import { promisify } from 'util';
import * as imageSize from 'image-size';
const sizeOf = promisify(imageSize);
import * as multer from 'multer';
const upload = multer({ dest: './uploads/' });

const s3Client = new AWS.S3();
const photoRoute = Router();

const uploadToS3 = async (filePath, nameToSave, mimeType) => {
  try {
    const fileBuffer = await fs.readFileSync(filePath);
    let params = {
      Bucket: S3.BUCKET,
      Key: S3.FOLDER.IMAGES + nameToSave,
      Body: fileBuffer,
      ACL: 'public-read',
      ContentType: mimeType
    };
    const uploadedObj = await s3Client.putObject(params).promise();
    await fs.unlinkSync(filePath);
    return uploadedObj;
  } catch (e) {
    console.log("S3 Error: ", e);
    throw e;
  }
};

photoRoute.post('/', upload.any(), async (req, res) => {
  try {
    console.log("files :", req.files, req.body);

    if (!req.files || req.files.length < 1) {
      throw 'Please select a media file.';
    }

    let userDetails;
    try {
      userDetails = await decodeToken(req.headers['access-token']);
    } catch (e) {
      throw 'Unauthorized Access. Please login.';
    }

    const ret = Joi.validate(
      req.body,
      Joi.object({
        projectId: Joi.string()
          .length(24)
          .required(),
        version: Joi.number().optional()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }

    const projectDetails = await Projects.findOne({_id: req.body.projectId});
    if(!projectDetails){
      throw "Please select valid project.";
    }

    let mediasToSave = [];
    const promises = req.files.map(async (v, i) => {
      console.log("inside promise : ", v);
      const dimensions = await sizeOf(v.path);
      const newName = md5(Math.floor(Math.random() * 9999999999999) + 1111111111111);
      let namePrefix = v.originalname.split('.');
      const mediaExtension = namePrefix.pop().toLowerCase();

      console.log(v.path,
        namePrefix.join('') + '_' + newName + '.' + mediaExtension,
        v.mimetype);

      await uploadToS3(
        v.path,
        namePrefix.join('') + '_' + newName + '.' + mediaExtension,
        v.mimetype
      );
      mediasToSave.push({
        projectId: req.body.projectId,
        version: req.body.version || 1,
        media: {
          filename: v.originalname,
          size: v.size,
          contentType: v.mimetype,
          mediaType: 'IMAGE',
          uploadedBy: userDetails._id,
          s3URL: S3.S3_URL + S3.FOLDER.IMAGES + namePrefix.join('') + '_' + newName + '.' + mediaExtension,
          extension: mediaExtension,
          thumbs: [],
          originalResolution: {
            width: dimensions.width,
            height: dimensions.height
          }
        }
      });
    });
    await Promise.all(promises);
    const savedPhotos = await Photos.create(mediasToSave);
    res.send({ statusCode: 200, data: savedPhotos });
  } catch (err) {
    console.log(err);
    res.status(400).json({ statusCode: 400, error: err });
  }
});


photoRoute.delete('/', async (req, res) => {
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
        photoId: Joi.string().required()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }

    const photoDetails = await Photos.findOne({_id: req.body.photoId});
    if (!photoDetails) {
      throw "Please select a valid photo."
    }

    let setQuery = {};
    if(userDetails.isPhotographer){
      setQuery["isDeleted"] = true;
    }
    else{
      setQuery["clientDeleted"] = true;
    }

    await Photos.update({_id: photoDetails._id}, {
      $set: setQuery
    });
    res.send({statusCode: 200, data: {}, message: "Deleted successfully."});
  } catch (err) {
    console.log(err);
    res.status(400).json({ statusCode: 400, error: err });
  }
});

export default photoRoute;
