import { S3 } from '../constants';
import { Router } from 'express';
import Media from '../models/medias';
import * as md5 from 'md5';
import * as AWS from 'aws-sdk';
AWS.config.update({ accessKeyId: S3.ACCESS_KEY_ID, secretAccessKey: S3.SECRET_ACCESS_KEY });
import * as fs from 'fs';
import { decodeToken } from '../lib/common_functions';
import { promisify } from 'util';
import * as imageSize from 'image-size';
const sizeOf = promisify(imageSize);
import * as multer from 'multer';
const upload = multer({ dest: './uploads/' });

const s3Client = new AWS.S3();
const mediaRoutes = Router();

mediaRoutes.post('/create', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      throw 'Please select a media file.';
    }
    let userDetails;
    try {
      userDetails = await decodeToken(req.headers['access-token']);
    } catch (e) {
      throw 'Unauthorized Access. Please login.';
    }
    const dimensions = await sizeOf(req.file.path);
    const newName = md5(Math.floor(Math.random() * 9999999999999) + 1111111111111);
    let namePrefix = req.file.originalname.split('.');
    const mediaExtension = namePrefix.pop().toLowerCase();
    await uploadToS3(
      req.file.path,
      namePrefix.join('') + newName + '.' + mediaExtension,
      req.file.mimetype
    );
    const mediaObj = {
      filename: req.file.originalname,
      size: req.file.size,
      contentType: req.file.mimetype,
      mediaType: 'IMAGE',
      uploadedBy: userDetails._id,
      s3URL: S3.S3_URL + S3.FOLDER.IMAGES + '/' + namePrefix.join('') + newName + '.' + mediaExtension,
      extension: mediaExtension,
      thumbs: [],
      originalResolution:  {
        width: dimensions.width,
        height: dimensions.height
      }
    };
    let mediaToSave = new Media(mediaObj);
    const savedMedia = await mediaToSave.save();
    res.send({ statusCode: 200, data: savedMedia });
  } catch (err) {
    console.log(err);
    res.status(400).json({ statusCode: 400, error: err });
  }
});

const uploadToS3 = async (filePath, nameToSave, mimeType) => {
  try {
    const fileBuffer = await fs.readFileSync(filePath);
    let params = {
      Bucket: S3.BUCKET,
      Key: S3.FOLDER.IMAGES + '/' + nameToSave,
      Body: fileBuffer,
      ACL: 'public-read',
      ContentType: mimeType
    };

    const uploadedObj = await s3Client.putObject(params).promise();
    fs.unlinkSync(filePath);
    return uploadedObj;
  } catch (e) {
    throw e;
  }
};

mediaRoutes.post('/create_multiple', upload.any(), async (req, res) => {
  try {
    console.log("files :", req.files, req.body);
    if (!req.file) {
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

    const dimensions = await sizeOf(req.file.path);
    const newName = md5(Math.floor(Math.random() * 9999999999999) + 1111111111111);
    let namePrefix = req.file.originalname.split('.');
    const mediaExtension = namePrefix.pop().toLowerCase();
    await uploadToS3(
      req.file.path,
      namePrefix.join('') + newName + '.' + mediaExtension,
      req.file.mimetype
    );
    const mediaObj = {
      filename: req.file.originalname,
      size: req.file.size,
      contentType: req.file.mimetype,
      mediaType: 'IMAGE',
      uploadedBy: userDetails._id,
      s3URL: S3.S3_URL + S3.FOLDER.IMAGES + '/' + namePrefix.join('') + newName + '.' + mediaExtension,
      extension: mediaExtension,
      thumbs: [],
      originalResolution:  {
        width: dimensions.width,
        height: dimensions.height
      }
    };
    let mediaToSave = new Media(mediaObj);
    const savedMedia = await mediaToSave.save();
    res.send({ statusCode: 200, data: savedMedia });
  } catch (err) {
    console.log(err);
    res.status(400).json({ statusCode: 400, error: err });
  }
});

export default mediaRoutes;
