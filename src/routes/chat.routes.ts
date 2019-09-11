import { Request, Response, Router } from 'express';
import uuid from 'uuid';

import DialogFlowController from '../controllers/dialogflow.controller';

export default (router: Router) => {
    router.get('/', async (req: Request, res: Response) => {
        res.send('Hello chatbot');
    });
};
