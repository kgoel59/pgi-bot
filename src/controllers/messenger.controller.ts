import crypto from 'crypto';
import request from 'request';
import fbkey from '../config/messenger.json';

import { IncomingMessage, ServerResponse } from 'http';
import { IMessengerApp } from '../types/IMessengerApp';
import { ISend, ISQuickReply } from '../types/IMessengerSend';

class MessengerController implements IMessengerApp {

    public verifyWebHook(mode: string, verifytoken: string): boolean {
        if (mode === 'subscribe' && verifytoken === fbkey.fb_verify_token) {
            return true;
        }
        return false;
    }

    public verifyRequestSignature(req: IncomingMessage, res: ServerResponse, buf: Buffer) {
        const signature = req.headers['x-hub-signature'].toString();

        if (!signature) {
            throw new Error('Couldn\'t validate the signature.');
        } else {
            const elements = signature.split('=');
            const method = elements[0];
            const signatureHash = elements[1];

            const expectedHash = crypto.createHmac('sha1', fbkey.fb_app_secret)
                .update(buf)
                .digest('hex');

            if (signatureHash !== expectedHash) {
                throw new Error("Couldn't validate the request signature.");
            }
        }
    }

    public sendTextMessage(recipientId: string, text: string) {
        const messageData = {
            recipient: {
                id: recipientId,
            },
            message: {
                text,
            },
        };
        this.callSendAPI(messageData);
    }

    public sendImageMessage(recipientId: string, imageUrl: string) {
        const messageData = {
            recipient: {
                id: recipientId,
            },
            message: {
                attachment: {
                    type: 'image',
                    payload: {
                        url: imageUrl,
                    },
                },
            },
        };

        this.callSendAPI(messageData);
    }

    public sendAudioMessage(recipientId: string, audioUrl: string) {
        const messageData = {
            recipient: {
                id: recipientId,
            },
            message: {
                attachment: {
                    type: 'audio',
                    payload: {
                        url: audioUrl,
                    },
                },
            },
        };

        this.callSendAPI(messageData);
    }

    public sendVideoMessage(recipientId: string, videoUrl: string) {
        const messageData = {
            recipient: {
                id: recipientId,
            },
            message: {
                attachment: {
                    type: 'video',
                    payload: {
                        url: videoUrl,
                    },
                },
            },
        };

        this.callSendAPI(messageData);
    }

    public sendFileMessage(recipientId: string, fileUrl: string) {
        const messageData = {
            recipient: {
                id: recipientId,
            },
            message: {
                attachment: {
                    type: 'file',
                    payload: {
                        url: fileUrl,
                    },
                },
            },
        };

        this.callSendAPI(messageData);
    }

    public sendQuickReply(recipientId: string, text: string, replies: ISQuickReply[], metadata?: string) {
        const messageData = {
            recipient: {
                id: recipientId,
            },
            message: {
                text,
                metadata: (metadata !== undefined) ? metadata : '',
                quick_replies: replies,
            },
        };

        this.callSendAPI(messageData);
    }

    public sendTypingOn(recipientId: string) {
        const messageData = {
            recipient: {
                id: recipientId,
            },
            sender_action: 'typing_on',
        };

        this.callSendAPI(messageData);
    }

    public sendTypingOff(recipientId: string) {
        const messageData = {
            recipient: {
                id: recipientId,
            },
            sender_action: 'typing_off',
        };

        this.callSendAPI(messageData);
    }

    public callSendAPI(messageData: ISend) {
        request({
            uri: 'https://graph.facebook.com/v3.2/me/messages',
            qs: {
                access_token: fbkey.fb_page_token,
            },
            method: 'POST',
            json: messageData,

        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const recipientId = body.recipient_id;
                const messageId = body.message_id;

                if (messageId) {
                    console.log('Successfully sent message with id %s to recipient %s',
                        messageId, recipientId);
                } else {
                    console.log('Successfully called Send API for recipient %s',
                        recipientId);
                }
            } else {
                console.error('Failed calling Send API', response.statusCode, response.statusMessage, body.error);
            }
        });
    }
}

export default new MessengerController();
