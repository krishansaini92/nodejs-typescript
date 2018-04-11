import { Schema, model } from 'mongoose';

const Comments = new Schema(
  {
    photoId: { type: Schema.ObjectId, ref: 'photos' },
    comment: { type: String },
    user: { type: Schema.ObjectId, ref: 'users' },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true, strict: false }
);

export default model('Comments', Comments);
