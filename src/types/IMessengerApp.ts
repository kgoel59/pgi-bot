import { IncomingMessage, ServerResponse } from 'http';
import { ISElement, ISend, ISQuickReply } from 'IMessengerSend';

export interface IMessengerApp {
    verifyWebHook: (mode: string, verifytoken: string) => boolean;
    verifyRequestSignature: (req: IncomingMessage, res: ServerResponse, buf: Buffer) => void;
    callSendAPI: (messageData: ISend) => void;
    sendTextMessage: (recipientId: string, text: string) => void;
    sendImageMessage: (recipientId: string, imageUrl: string) => void;
    sendAudioMessage: (recipientId: string, audioUrl: string) => void;
    sendVideoMessage: (recipientId: string, videoUrl: string) => void;
    sendFileMessage: (recipientId: string, fileUrl: string) => void;
    sendGenericMessage: (recipientId: string, elements: ISElement[]) => void;
    sendQuickReply: (recipientId: string, text: string, replies: ISQuickReply[], metadata?: string) => void;
    sendTypingOn: (recipientId: string) => void;
    sendTypingOff: (recipientId: string) => void;
}

