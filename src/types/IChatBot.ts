import { IDialogflowApp } from './IDialogflowApp';
import { IMessengerApp } from './IMessengerApp';
import { IEMessaging } from './IMessengerEvent';

export interface IChatBot {
    dialogflowApp: IDialogflowApp;
    messengerApp: IMessengerApp;

    receivedAuthentication: (event: IEMessaging) => void;
    receivedMessage: (event: IEMessaging) => void;
    receivedDeliveryConfirmation: (event: IEMessaging) => void;
    receivedPostback: (event: IEMessaging) => void;
    receivedMessageRead: (event: IEMessaging) => void;
    receivedAccountLink: (event: IEMessaging) => void;
}
