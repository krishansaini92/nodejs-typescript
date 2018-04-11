import { Router } from 'express';
import projectRoute from './project';
import photoRoute from './photo';
import shareRoute from './share';
import commentRoute from './comment';

const projectRoutes = Router();

projectRoutes.use('/create', projectRoute);
projectRoutes.use('/photos', photoRoute);
projectRoutes.use('/share', shareRoute);
projectRoutes.use('/comment', commentRoute);

export default projectRoutes;