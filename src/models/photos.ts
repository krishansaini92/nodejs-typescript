import { Schema, model } from 'mongoose';

const Photos = new Schema(
  {
    projectId: { type: Schema.ObjectId, ref: 'projects' },
    caption: { type: String, index: true },
    version: { type: Number, default: 1, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    comments: [{ type: Schema.ObjectId, ref: 'comments' }],
    clientDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true, strict: false }
);

export default model('Photos', Photos);
