// ref: https://developers.facebook.com/docs/messenger-platform/webhook-reference/

import bodyParser from 'body-parser';
import { CardMessage, Context, Message, QueryResult } from 'dialogflow';
import { Application } from 'express';
import { IChatBot } from '../types/IChatBot';
import { IDialogflowApp } from '../types/IDialogflowApp';
import { IMessengerApp } from '../types/IMessengerApp';
import { IEAttachment, IEMessaging, IEQuickReply } from '../types/IMessengerEvent';
import { ISButton, ISElement, ISQuickReply } from '../types/IMessengerSend';

import { IDepartment } from '../models/department.model';
import { IDoctor } from '../models/doctor.model';

import AppointmentController from './appointment.controller';
import DepartmentController from './department.controller';
import DoctorController from './doctor.controller';

import serverkey from '../config/server.json';
import UserController from './user.controller';

class ChatBotController implements IChatBot {

    public dialogflowApp: IDialogflowApp;
    public messengerApp: IMessengerApp;

    public appointments: Map<string, any> = new Map();

    constructor(express: Application, dialogflowApp: IDialogflowApp, messengerApp: IMessengerApp) {
        express.use(bodyParser.json({
            verify: messengerApp.verifyRequestSignature,
        }));

        this.dialogflowApp = dialogflowApp;
        this.messengerApp = messengerApp;
    }

    public async receivedAuthentication(event: IEMessaging) {
        const senderID = event.sender.id;
        const recipientID = event.recipient.id;
        const timeOfAuth = event.timestamp;

        // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
        // The developer can set this to an arbitrary value to associate the
        // authentication callback with the 'Send to Messenger' click event. This is
        // a way to do account linking when the user clicks the 'Send to Messenger'
        // plugin.
        const passThroughParam = event.optin.ref;

        console.log('Received authentication for user %d and page %d with pass ' +
            "through param '%s' at %d", senderID, recipientID, passThroughParam,
            timeOfAuth);

        // When an authentication is received, we'll send a message back to the sender
        // to let them know it was successful.
        this.messengerApp.sendTextMessage(senderID, 'Authentication successful');
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

        if (!this.messengerApp.users.has(senderID)) {
            const user = await this.messengerApp.getUser(senderID);
            this.messengerApp.users.set(senderID, user);
        }

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
        const senderID = event.sender.id;
        const recipientID = event.recipient.id;
        const delivery = event.delivery;
        const messageIDs = delivery.mids;
        const watermark = delivery.watermark;

        if (messageIDs) {
            messageIDs.forEach((messageID) => {
                console.log('Received delivery confirmation for message ID: %s',
                    messageID);
            });
        }

        console.log('All message before %d were delivered.', watermark);
    }

    public async receivedPostback(event: IEMessaging) {
        const senderID = event.sender.id;
        const recipientID = event.recipient.id;
        const timeOfPostback = event.timestamp;

        // The 'payload' param is a developer-defined field which is set in a postback
        // button for Structured Messages.
        const payload = event.postback.payload;
        const pact = JSON.parse(payload);

        switch (pact.paction) {
            case 'docInfo':
                this.sendDoctors(senderID, pact.id);
                break;
            case 'docDetail':
                this.sendDoctorDetails(senderID, pact.id);
                break;
            default:
                // unindentified payload
                const response = await this.dialogflowApp.sendToDialogflow(senderID, pact.paction);
                this.handleDialogflowResponse(senderID, response);
                break;

        }

        console.log("Received postback for user %d and page %d with payload '%s' " +
            'at %d', senderID, recipientID, payload, timeOfPostback);
    }

    public async receivedMessageRead(event: IEMessaging) {
        const senderID = event.sender.id;
        const recipientID = event.recipient.id;

        // All messages before watermark (a timestamp) or sequence have been seen.
        const watermark = event.read.watermark;

        console.log('Received message read event for watermark %d and sequence ' +
            'number %d', watermark);
    }

    public async receivedAccountLink(event: IEMessaging) {
        const senderID = event.sender.id;
        const recipientID = event.recipient.id;

        const status = event.account_linking.status;
        const authCode = event.account_linking.authorization_code;

        console.log('Received account link event with for user %d with status %s ' +
            'and auth code %s ', senderID, status, authCode);
    }

    private handleDialogflowResponse(senderID: string, response: QueryResult) {
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
                setTimeout(this.handleCardMessages.bind(this, senderID, cards), timeout);
                cards = [];
                timeout = (i) * timeoutInterval;
            }  else if (messages[i].message === 'card' && i === messages.length - 1) {
                cards.push(messages[i]);
                timeout = (i - 1) * timeoutInterval;
                setTimeout(this.handleCardMessages.bind(this, senderID, cards), timeout);
                cards = [];
            } else if ( messages[i].message === 'card') {
                cards.push(messages[i]);
            } else {
                timeout = i * timeoutInterval;
                setTimeout(this.handleMessage.bind(this, senderID, messages[i]), timeout);
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
                        payload: JSON.stringify({qaction: text}),
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
        const elements: ISElement[] = new Array();
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
                         payload: JSON.stringify({paction: button.postback}),
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

    // quick action

    private async handleQuickReply(senderID: string, quickReply: IEQuickReply, messageId: string) {
        const quickReplyPayload = quickReply.payload;
        console.log('Quick reply for message %s with payload %s', messageId, quickReplyPayload);

        const qact = JSON.parse(quickReplyPayload);
        switch (qact.qaction) {
            case 'depInfo' :
                this.SendDepartmentCard(senderID, qact.id);
                await this.messengerApp.resolveAfterXSeconds(2);
                this.SendDepartmentsQuickReply(senderID, 'Other Departments');
                break;
            case 'bookapp' :
                if (qact.id) {
                    AppointmentController.UpdateAppointment(qact.id, {doctor: qact.doc});
                    this.appointments.delete(senderID);
                    this.messengerApp.sendTextMessage(senderID, 'Thank you your appointment has been done');
                } else {
                    this.appointments.set(senderID, {doctor: qact.doc});
                    const eresponse = await this.dialogflowApp.sendEventToDialogFlow(senderID, 'BOOK', {});
                    this.handleDialogflowResponse(senderID, eresponse);
                }
                break;
            case 'getdoccontact':
                const cdoctor = await DoctorController.GetDoctorByID(qact.id);
                this.messengerApp.sendTextMessage(senderID, `You can contact ${cdoctor.name} on ${cdoctor.contact}`);
                await this.messengerApp.resolveAfterXSeconds(1);
                this.SendDoctorQuickReply(senderID, qact.id);
                break;
            case 'getdocopd':
                const pdoctor = await DoctorController.GetDoctorByID(qact.id);
                this.messengerApp.sendTextMessage(senderID, `OPD days for ${pdoctor.name} are:`);
                await this.messengerApp.resolveAfterXSeconds(1);
                this.messengerApp.sendTextMessage(senderID, pdoctor.opdDays.toString());
                await this.messengerApp.resolveAfterXSeconds(1);
                this.SendDoctorQuickReply(senderID, qact.id);
                break;
            default:
                // send payload to dialogflow
                const response = await this.dialogflowApp.sendToDialogflow(senderID, qact.qaction);
                this.handleDialogflowResponse(senderID, response);
        }
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

    // Main Action logic

    private async handleDialogflowAction(senderID: string,
                                         action: string,
                                         messages: Message[],
                                         contexts: Context[],
                                         parameters: any) {
        switch (action) {

            case 'GET_STARTED' :
                this.messengerApp.greetUserText(senderID)
                .then(() => {
                    this.handleMessages(senderID, messages);
                })
                .catch((err) => {
                    throw err;
                });
                break;

            case 'GET_DEPARTMENTS' :
                this.SendDepartmentsQuickReply(senderID, 'Departments');
                break;
            case 'GET_DOCTORS':
                this.SendDepartmentsMenu(senderID);
                break;
            case 'GET_APPOINTMENT_DETAILS':
                this.GetAppointment(senderID, parameters, messages);
                break;
            case 'SAVE_APPOINTMENT':
                this.SaveAppointment(senderID, messages);
                break;
            case 'GET_CLASSIFIED_DEPARTMENT':
                this.SendPredictedDepartment(senderID, parameters);
                break;
            default:
                this.handleMessages(senderID, messages);
        }
    }


    // facebook logic

    private async SendDepartmentsQuickReply(senderID: string, title: string) {
        const departments = await DepartmentController.GetDepartments();

        const replies: ISQuickReply[] = new Array();

        for ( const department of departments) {
            const reply: ISQuickReply = {
                content_type: 'text',
                title: department.name,
                payload: JSON.stringify({qaction: 'depInfo', id: department._id}),
            };
            replies.push(reply);
        }
        this.messengerApp.sendQuickReply(senderID, title, replies);
    }

    private async GetAppointment(senderID: string, parameters: any, messages: Message[]) {
        const field = parameters.fields;
        const phone = field.phone.numberValue;
        const name = field.name.structValue.fields.name.stringValue;
        let mdoctor = null;
        if (this.appointments.has(senderID)) {
            mdoctor = this.appointments.get(senderID).doctor;
        }
        this.appointments.set(senderID, {
            pname: name,
            pphone: phone,
            doctor: mdoctor,
        });

        if (phone && name ) {
            this.messengerApp.sendTextMessage(senderID, `Name: ${name}\n Phone: ${phone}\n Do you confirm?`);
        } else {
            this.handleMessages(senderID, messages);
        }
    }

    private async SaveAppointment(senderID: string, messages: Message[]) {
        if (this.appointments.has(senderID)) {
            const appointment = this.appointments.get(senderID);
            if (appointment.pname !== '' && appointment.pphone !== '') {
                const user = await this.messengerApp.getUser(senderID);
                const appt = await UserController.AddAppointment(user, appointment.pname, appointment.pphone);
                if (appointment.doctor) {
                    const doctor = await DoctorController.GetDoctorByID(appointment.doctor);
                    this.messengerApp.sendTextMessage(senderID, `Your appointment with doctor ${doctor.name} has been done`);
                    AppointmentController.UpdateAppointment(appt._id, {doctor: doctor._id});
                    this.appointments.delete(senderID);
                } else {
                    this.appointments.set(senderID, {id: appt._id});
                    this.handleMessages(senderID, messages);
                }
            }
        }
    }

    private async SendPredictedDepartment(senderID: string, parameters: any) {
        const cdepartment = parameters.fields.department.listValue.values[0].stringValue;
        this.messengerApp.sendTextMessage(senderID, `These symptoms feel like of ${cdepartment}`);
        const department = await DepartmentController.GetDepartmentByName(cdepartment);

        if (department !== null) {
            const appointment = this.appointments.get(senderID);
            this.SendDepartmentCard(senderID, department._id);
            AppointmentController.UpdateAppointment(appointment.id, {department: cdepartment});
            await this.messengerApp.resolveAfterXSeconds(1);
            this.sendDoctors(senderID, department._id);
        } else {
            this.messengerApp.sendTextMessage(senderID, `Can you give some more detail ?`);
            const responses = await this.dialogflowApp.sendEventToDialogFlow(senderID, 'SYMPTOM', {});
            this.handleDialogflowResponse(senderID, responses);
        }
    }

    private async SendDepartmentsMenu(senderID: string) {
        const departments = await DepartmentController.GetDepartments();

        const elements: ISElement[] = new Array();
        for (const department of departments) {
            const element: ISElement = {
                title: department.name,
                subtitle: `Get doctors for ${department.name}`,
                image_url: `${serverkey.server_url}/${department.pic}`,
                buttons: [{
                    title: 'View Doctors',
                    type: 'postback',
                    payload: JSON.stringify({paction: 'docInfo', id: department._id}),
                }],
            };
            elements.push(element);
        }

        this.messengerApp.sendGenericMessage(senderID, elements);

    }

    private async SendDepartmentCard(senderID: string, depID: string) {
        const department = await DepartmentController.GetDepartmentByID(depID);

        const elements: ISElement[] = new Array();
        const element: ISElement = {
            title: department.name,
            subtitle: department.info,
            image_url: `${serverkey.server_url}/${department.pic}`,
            default_action: {
                type: 'web_url',
                url: department.more,
                webview_height_ratio: 'tall',
            },
            buttons: [{
                type: 'web_url',
                url: department.more,
                title: 'Read More',
            }],
        };
        elements.push(element);

        this.messengerApp.sendGenericMessage(senderID, elements);
    }

    private async sendDoctors(senderID: string, deptID: string) {
        const doctors: IDoctor[] = await DepartmentController.GetDepDoctors(deptID);

        if (doctors.length > 0) {
            const buttons: ISButton[] = new Array();
            for ( const doctor of doctors) {
                const button: ISButton = {
                    type: 'postback',
                    title: doctor.name,
                    payload: JSON.stringify({paction: 'docDetail', id: doctor.id}),
                };
                buttons.push(button);
            }
            this.messengerApp.sendButtonMessage(senderID, 'Doctors', buttons);
        } else {
            this.messengerApp.sendImageMessage(senderID, `${serverkey.server_url}/strike.jpeg`);
        }
    }

    private async sendDoctorDetails(senderID: string, docID: string) {
        const doctor = await DoctorController.GetDoctorByID(docID);

        const message: string = `name: ${doctor.name}\n speciality: ${doctor.speciality}`;
        this.messengerApp.sendTextMessage(senderID, message);

        await this.messengerApp.resolveAfterXSeconds(1);
        this.SendDoctorQuickReply(senderID, docID);
    }

    private async SendDoctorQuickReply(senderID: string, docID: string) {
        const replies: ISQuickReply[] = new Array();
        let bookId = null;
        if (this.appointments.has(senderID)) {
            const appointment = this.appointments.get(senderID);
            if (appointment.id) {
                bookId = appointment.id;
            }
        }
        const bookreply: ISQuickReply = {
            content_type: 'text',
            title: 'Book an appointment',
            payload: JSON.stringify({qaction: 'bookapp', id: bookId, doc: docID}),
        };

        const contactreply: ISQuickReply = {
            content_type: 'text',
            title: 'Contact Doctor',
            payload: JSON.stringify({qaction: 'getdoccontact', id: docID}),
        };

        const opdDays: ISQuickReply = {
            content_type: 'text',
            title: 'Get OPD days',
            payload: JSON.stringify({qaction: 'getdocopd', id: docID}),
        };

        replies.push(bookreply);
        replies.push(contactreply);
        replies.push(opdDays);


        this.messengerApp.sendQuickReply(senderID, 'Actions', replies);
    }
}

export default (express: Application,
                dialogflowApp: IDialogflowApp,
                messengerApp: IMessengerApp) => new ChatBotController(express, dialogflowApp, messengerApp);
