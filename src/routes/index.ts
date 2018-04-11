import { Router } from 'express';
import userRoutes from './user';
import mediaRoutes from './media';
import projectRoutes from './projects';

const routes = Router();

routes.use('/users', userRoutes);
routes.use('/medias', mediaRoutes);
routes.use('/projects', projectRoutes);

routes.get('/', (req, res) => {
  res.render('./welcome.pug', {
    name: 'Notification'
  });
});

export default routes;
