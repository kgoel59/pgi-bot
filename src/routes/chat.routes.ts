import { Request, Response, Router } from 'express';
import { IChatBot } from '../types/IChatBot';
import { IMessengerEvent } from '../types/IMessengerEvent';

export default (router: Router, bot: IChatBot) => {
    router.get('/', async (req: Request, res: Response) => {
        res.send('Hello I am a chatbot');
    });

    router.get('/webhook/', async (req: Request, res: Response) => {
        if (bot.messengerApp.verifyWebHook(req.query['hub.mode'], req.query['hub.verify_token'])) {
            res.status(200).send(req.query['hub.challenge']);
        } else {
            console.error('Failed validation. Make sure the validation tokens match.');
            res.sendStatus(403);
        }
    });

    router.post('/webhook/', async (req: Request, res: Response) => {
        const data: IMessengerEvent = req.body;

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
                        bot.receivedAuthentication(messagingEvent);
                    } else if (messagingEvent.message) {
                        bot.receivedMessage(messagingEvent);
                    } else if (messagingEvent.delivery) {
                        bot.receivedDeliveryConfirmation(messagingEvent);
                    } else if (messagingEvent.postback) {
                        bot.receivedPostback(messagingEvent);
                    } else if (messagingEvent.read) {
                        bot.receivedMessageRead(messagingEvent);
                    } else if (messagingEvent.account_linking) {
                        bot.receivedAccountLink(messagingEvent);
                    } else {
                        console.log('Webhook received unknown messagingEvent: ', messagingEvent);
                    }
                });
            });
        }

        res.sendStatus(200);
    });
};
