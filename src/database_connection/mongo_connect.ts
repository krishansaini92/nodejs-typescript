import {DATABASE, IS_PRODUCTION} from "../constants";
import * as mongoose from 'mongoose';

const mongoUri = DATABASE.MONGO.URI;

mongoose.set('debug', !IS_PRODUCTION);

export default mongoose.connect(mongoUri, {
    promiseLibrary: Promise
});
