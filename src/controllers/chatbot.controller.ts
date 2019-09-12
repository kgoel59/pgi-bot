import bodyParser from 'body-parser';
import { Message, QueryResult } from 'dialogflow';
import { Application } from 'express';
import { IChatBot } from '../types/IChatBot';
import { IDialogflowApp } from '../types/IDialogflowApp';
import { IMessengerApp } from '../types/IMessengerApp';
import { IEMessaging } from '../types/IMessengerEvent';
import { ISQuickReply } from '../types/IMessengerSend';


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
        if (messages !== undefined) {
            this.handleMessages(senderID, messages);
        } else if (responseText !== undefined) {
            this.messengerApp.sendTextMessage(senderID, responseText);
        }
    }

    private handleMessages(senderID: string, messages: Message[]) {
        const timeoutInterval = 1100;
        let timeout = 0;

        for (let i = 0; i < messages.length; i++) {
            timeout = i * timeoutInterval;
            setTimeout(() => {
                this.handleMessage(senderID, messages[i]);
            }, timeout);
        }
    }

    private handleMessage(senderID: string, message: Message) {
        switch (message.message) {
            case 'text': // text
                message.text.text.forEach((text) => {
                    if (text !== '') {
                        this.messengerApp.sendTextMessage(senderID, text);
                    }
                });
                break;
            case 'quickReplies': // quick replies
                const replies: ISQuickReply[] = new Array();
                message.quickReplies.quickReplies.forEach((text) => {
                    const reply = {
                        content_type: 'text',
                        title: text,
                        payload: text,
                    };
                    replies.push(reply);
                });
                this.messengerApp.sendQuickReply(senderID, message.quickReplies.title, replies);
                break;
            case 'image': // image
                this.messengerApp.sendImageMessage(senderID, message.image.imageUri);
                break;
        }
    }
}

export default (express: Application,
                dialogflowApp: IDialogflowApp,
                messengerApp: IMessengerApp) => new ChatBotController(express, dialogflowApp, messengerApp);
