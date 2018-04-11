import { Schema, model } from 'mongoose';

const Projects = new Schema(
  {
    createdBy: { type: Schema.ObjectId, ref: 'user' },
    name: { type: String, required: true, index: true },
    photosCount: { type: Number, default: 0, index: true },
    isDeleted: {type: Boolean, default: false, index: true },
    clientContactDetails: {
      countryCode: { type: String },
      phoneNumber: { type: String },
      email: { type: String }
    },
    client : { type: Schema.ObjectId, ref: 'user' },
    referralCode : { type: String, index: true }
  },
  { timestamps: true }
);
Projects.index({name:"text"})
export default model('Projects', Projects);
