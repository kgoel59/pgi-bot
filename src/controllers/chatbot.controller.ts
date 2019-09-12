import bodyParser from 'body-parser';
import { QueryResult } from 'dialogflow';
import { Application } from 'express';
import { IChatBot } from '../types/IChatBot';
import { IDialogflowApp } from '../types/IDialogflowApp';
import { IMessengerApp } from '../types/IMessengerApp';
import { IEMessaging } from '../types/IMessengerEvent';

class ChatBotController implements IChatBot {

    public dialogflowApp: IDialogflowApp;
    public messengerApp: IMessengerApp;

    constructor(express: Application, dialogflowApp: IDialogflowApp, messengerApp: IMessengerApp) {
        express.use(bodyParser.json({
            verify: messengerApp.verifyRequestSignature,
        }));

        this.dialogflowApp = dialogflowApp;
        this.messengerApp = messengerApp;
    }

    public receivedAuthentication(event: IEMessaging) {
        //
    }

    public async receivedMessage(event: IEMessaging) {
        // logic to handle received messages
        const senderID = event.sender.id;
        const recipientID = event.recipient.id;
        const timeOfMessage = event.timestamp;
        const message = event.message;
        const isEcho = message.is_echo;
        const messageId = message.mid;
        const appId = message.app_id;
        const metadata = message.metadata;

        // You may get a text or attachment but not both
        const messageText = message.text;
        const messageAttachments = message.attachments;
        const quickReply = message.quick_reply;

        if (messageText) {
            // send message to dialogflow
            this.messengerApp.sendTypingOn(senderID);
            const response = await this.dialogflowApp.sendToDialogflow(senderID, messageText);
            this.handleDialogflowResponse(senderID, response);
        }
    }

    public receivedDeliveryConfirmation(event: IEMessaging) {
        //
    }

    public receivedPostback(event: IEMessaging) {
        //
    }

    public receivedMessageRead(event: IEMessaging) {
        //
    }

    public receivedAccountLink(event: IEMessaging) {
        //
    }

    private handleDialogflowResponse(senderID: string, response: QueryResult) {
        const responseText = response.fulfillmentText;

        const messages = response.fulfillmentMessages;
        const action = response.action;
        const contexts = response.outputContexts;
        const parameters = response.parameters;

        this.messengerApp.sendTypingOff(senderID);

        if (responseText !== undefined) {
            this.messengerApp.sendTextMessage(senderID, responseText);
        }
    }
}

export  default (express: Application,
                 dialogflowApp: IDialogflowApp,
                 messengerApp: IMessengerApp) => new ChatBotController(express, dialogflowApp, messengerApp);
