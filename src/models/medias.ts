import { Schema, model } from 'mongoose';

const Media = new Schema(
  {
    uploadedBy: { type: Schema.ObjectId, ref: 'user' },
    s3URL: { type: String },
    filename: { type: String, required: true },
    extension: { type: String },
    contentType: { type: String, required: true },
    size: { type: Number, required: true }, // in Bytes
    thumb: { type: String },
    mediaType: {
      type: String,
      enum: ['IMAGE', 'VIDEO'],
      default: 'IMAGE'
    },
    usedStatus: { type: Boolean, default: false },
    thumbs: [
      {
        path: { type: String },
        width: { type: Number },
        height: { type: Number }
      }
    ],
    originalResolution: {
      width: { type: Number },
      height: { type: Number }
    }
  },
  { timestamps: true }
);

export default model('Media', Media);
