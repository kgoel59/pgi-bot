import { Request, Response, Router } from 'express';
import { IDialogflowApp } from '../controllers/dialogflow.controller';
import { IFacebookEvent } from '../types/IFacebookEvent';

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

    router.post('/webhook/', async (req: Request, res: Response) => {
        const data: IFacebookEvent = req.body;

        // Make sure this is a page subscription
        if (data.object === 'page') {

            // Iterate over each entry
            // There may be multiple if batched

            data.entry.forEach((pageEntry) => {
                const pageID = pageEntry.id;
                const timeOfEvent = pageEntry.time;

                // Iterate over each messaging event
                pageEntry.messaging.forEach((messagingEvent) => {
                    if (messagingEvent.optin) {
                        dialogflowApp.receivedAuthentication(messagingEvent);
                    } else if (messagingEvent.message) {
                        dialogflowApp.receivedMessage(messagingEvent);
                    } else if (messagingEvent.delivery) {
                        dialogflowApp.receivedDeliveryConfirmation(messagingEvent);
                    } else if (messagingEvent.postback) {
                        dialogflowApp.receivedPostback(messagingEvent);
                    } else if (messagingEvent.read) {
                        dialogflowApp.receivedMessageRead(messagingEvent);
                    } else if (messagingEvent.account_linking) {
                        dialogflowApp.receivedAccountLink(messagingEvent);
                    } else {
                        console.log('Webhook received unknown messagingEvent: ', messagingEvent);
                    }
                });
            });
        }
    });
};
