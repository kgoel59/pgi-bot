import bodyParser from 'body-parser';
import app from './app';
import chatRoutes from './routes/chat.routes';

import mongo from './config/mongo.json';

app.express.use(bodyParser.json());
app.express.use(bodyParser.urlencoded({ extended: true })); // for parsing form data

app.connectDB(mongo.db_conn, mongo.db_user, mongo.db_pass);
app.mountRoutes(chatRoutes);
app.start(5000);
