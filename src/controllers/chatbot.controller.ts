// ref: https://developers.facebook.com/docs/messenger-platform/webhook-reference/

import bodyParser from 'body-parser';
import { CardMessage, Context, Message, QueryResult } from 'dialogflow';
import { Application } from 'express';
import { IChatBot } from '../types/IChatBot';
import { IDialogflowApp } from '../types/IDialogflowApp';
import { IMessengerApp } from '../types/IMessengerApp';
import { IEAttachment, IEMessaging, IEQuickReply } from '../types/IMessengerEvent';
import { ISButton, ISQuickReply } from '../types/IMessengerSend';


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

    public async receivedAuthentication(event: IEMessaging) {
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

        if (isEcho) {
            // handle echo
           this.handleEcho(messageId, appId, metadata);
           return;
        } else if (quickReply) {
            // handle quickreply
            this.handleQuickReply(senderID, quickReply, messageId);
            return;
        }

        // switch on bot is typing
        this.messengerApp.sendTypingOn(senderID);

        if (messageText) {
            // send message to dialogflow
            const response = await this.dialogflowApp.sendToDialogflow(senderID, messageText);
            this.handleDialogflowResponse(senderID, response);
        } else if (messageAttachments) {
            // handle message attachments
            this.handleMessageAttachments(senderID, messageAttachments);
        }
    }

    public async receivedDeliveryConfirmation(event: IEMessaging) {
        //
    }

    public async receivedPostback(event: IEMessaging) {
        //
    }

    public async receivedMessageRead(event: IEMessaging) {
        //
    }

    public receivedAccountLink(event: IEMessaging) {
        //
    }

    private handleDialogflowResponse(senderID: string, response: QueryResult) {
        console.log(response.fulfillmentMessages);
        const responseText = response.fulfillmentText;

        const messages = response.fulfillmentMessages;
        const action = response.action;
        const contexts = response.outputContexts;
        const parameters = response.parameters;

        // switch Off bot is typing
        this.messengerApp.sendTypingOff(senderID);

        if (action !== undefined) {
            this.handleDialogflowAction(senderID, action, messages, contexts, parameters);
        } else if (messages !== undefined) {
            this.handleMessages(senderID, messages);
        } else if (responseText !== undefined) {
            this.messengerApp.sendTextMessage(senderID, responseText);
        }
    }

    private handleMessages(senderID: string, messages: Message[]) {
        const timeoutInterval = 1100;
        let prevType: string;
        let cards: any[] = new Array();
        let timeout = 0;

        for (let i = 0; i < messages.length; i++) {
            if (prevType === 'card' && (messages[i].message !== 'card' || i === messages.length - 1)) {
                timeout = (i - 1) * timeoutInterval;
                setTimeout(() => {
                    this.handleCardMessages(senderID, cards);
                }, timeout);
                cards = [];
                timeout = (i) * timeoutInterval;
            }  else if (messages[i].message === 'card' && i === messages.length - 1) {
                cards.push(messages[i]);
                timeout = (i - 1) * timeoutInterval;
                setTimeout(() => {
                    this.handleCardMessages(senderID, cards);
                }, timeout);
                cards = [];
            } else if ( messages[i].message === 'card') {
                cards.push(messages[i]);
            } else {
                timeout = i * timeoutInterval;
                setTimeout(() => {
                    this.handleMessage(senderID, messages[i]);
                }, timeout);
            }
            prevType =  messages[i].message;
        }
    }

    // text, image , audio , quickreply , video all by this function
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

    private handleCardMessages(senderID: string, messages: CardMessage[]) {
        const elements = [];
        for (const message of messages) {
            const buttons: ISButton[] = new Array();

            for (const button of message.card.buttons) {
                const isLink = (button.postback.substring(0, 4) === 'http');

                let Sbutton: ISButton;
                if (isLink) {
                    Sbutton = {
                         type: 'web_url',
                         title: button.text,
                         url: button.postback,
                    };
                } else {
                    Sbutton = {
                         type: 'postback',
                         title: button.text,
                         payload: button.postback,
                    };
                }
                buttons.push(Sbutton);
            }

            const element = {
                 title: message.card.title,
                 image_url: message.card.imageUri,
                 subtitle: message.card.subtitle,
                 buttons,
            };
            elements.push(element);
        }
        this.messengerApp.sendGenericMessage(senderID, elements);
    }

    private handleQuickReply(senderID: string, quickReply: IEQuickReply, messageId: string) {
        const quickReplyPayload = quickReply.payload;
        console.log('Quick reply for message %s with payload %s', messageId, quickReplyPayload);

        // send payload to dialogflow
        this.dialogflowApp.sendToDialogflow(senderID, quickReplyPayload);
    }

    private handleEcho(messageId: string, appId: number, metadata: string) {
        // Just logging message echoes to console
        console.log('Received echo for message %s and app %d with metadata %s', messageId, appId, metadata);
    }

    private handleMessageAttachments(senderID: string, messageAttachments: IEAttachment[]) {
        // switch Off bot is typing
        this.messengerApp.sendTypingOff(senderID);

        // for now just reply
        this.messengerApp.sendTextMessage(senderID, 'Attachment received. Thank you.');
    }

    private handleDialogflowAction(senderID: string,
                                   action: string,
                                   messages: Message[],
                                   contexts: Context[],
                                   parameters: any) {
        switch (action) {
            default:
                this.handleMessages(senderID, messages);
        }
    }
}

export default (express: Application,
                dialogflowApp: IDialogflowApp,
                messengerApp: IMessengerApp) => new ChatBotController(express, dialogflowApp, messengerApp);
