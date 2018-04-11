import {Router} from 'express';
import {
  joiFailurePrettier,
  decodeToken
} from '../../lib/common_functions';
import Projects from '../../models/projects';
import Photos from '../../models/photos';
import Comments from '../../models/comments';
import * as Joi from 'joi';

const commentRoute = Router();

commentRoute.post('/', async (req, res) => {
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
        photo: Joi.string().length(24).required(),
        comment: Joi.string().required(),
        commentId: Joi.string().optional()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }

    const photoDetails = await Photos.findOne({_id: req.body.photo});
    if (!photoDetails) {
      throw "Please select a valid photo."
    }

    const commentToSave = {
      photoId: req.body.photo,
      comment: req.body.comment,
      user: userDetails._id
    };
    if (req.body.commentId) {
      commentToSave["_id"] = req.body.commentId;
    }
    const commentObj = new Comments(commentToSave);
    const savedComment = await commentObj.save();

    await Photos.findOneAndUpdate({_id: photoDetails._id}, {
      $addToSet: {
        comments: savedComment._id
      }
    });
    res.send({statusCode: 200, data: savedComment});
  } catch (err) {
    console.warn(err);
    res.status(400).json({statusCode: 400, error: err});
  }
});

commentRoute.delete('/', async (req, res) => {
  try {
    try {
      await decodeToken(req.headers['access-token']);
    } catch (e) {
      throw 'Unauthorized Access. Please login.';
    }
    const ret = Joi.validate(
      req.body,
      Joi.object({
        commentId: Joi.string().required()
      })
    );
    if (ret.error) {
      throw joiFailurePrettier(ret);
    }

    const commentDetails = await Comments.findOne({_id: req.body.commentId});
    if (!commentDetails) {
      throw "Please select a valid comment."
    }

    await Comments.update({_id: commentDetails._id}, {
      $set: {
        isDeleted: true
      }
    });

    await Photos.update({_id: commentDetails.photoId}, {
      $pull: {
        comments: commentDetails._id
      }
    });
    res.send({statusCode: 200, data: {}, message: "Deleted successfully."});
  } catch (err) {
    console.warn(err);
    res.status(400).json({statusCode: 400, error: err});
  }
});

export default commentRoute;
