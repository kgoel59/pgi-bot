import bodyParser from 'body-parser';
import path from 'path';

import app from './app';
import chatRoutes from './routes/chat.routes';

import chatBot from './controllers/chatbot.controller';
import dialogflowApp from './controllers/dialogflow.controller';
import messengerApp from './controllers/messenger.controller';

import mongo from './config/mongo.json';

app.express.use(bodyParser.json());
app.express.use(bodyParser.urlencoded({ extended: true })); // for parsing form data

app.setStatic(path.join(__dirname, 'public'));

app.connectDB(mongo.db_conn, mongo.db_user, mongo.db_pass);

const bot = chatBot(app.express, dialogflowApp, messengerApp);
app.mountChatBot(chatRoutes, bot);
app.start(5000);
