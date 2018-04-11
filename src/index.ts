import * as express from 'express';
import routes from './routes';
import * as bodyParser from 'body-parser';
import * as path from 'path';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import * as picom from 'picom';
import { SERVER } from './constants';
import './database_connection/mongo_connect';
const app = express();

const port = 3333/*SERVER.PORT*/;
app.use(bodyParser.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', routes);
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');
app.listen(port, (err) => {
  if (err) {
    console.log('Server could not start ', err);
    return;
  }
  console.log('Server running at port : ', port);
});

let service2 = new picom('service2');
//console.log(service2.constructor);
service2.connect();
service2.publish('service1.fib', {
  x: 9000
});

/*
service2.request('service1.returnError').catch(function(err) {
  // err is instance of Error with message: 'something went wrong'
  console.log(err);
});*/
