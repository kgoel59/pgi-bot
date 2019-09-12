import { Request, Response, Router } from 'express';
import { IDialogflowApp } from '../controllers/dialogflow.controller';

export default (router: Router, dialogflowApp: IDialogflowApp) => {
    router.get('/', async (req: Request, res: Response) => {
        res.send('Hello I am a chatbot');
    });

    router.get('/webhook/', async (req: Request, res: Response) => {
        if (dialogflowApp.verifyWebHook(req.query['hub.mode'], req.query['hub.verify_token'])) {
            res.status(200).send(req.query['hub.challenge']);
        } else {
            console.error('Failed validation. Make sure the validation tokens match.');
            res.sendStatus(403);
        }
    });
};
