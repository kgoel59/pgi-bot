import bodyParser from 'body-parser';
import crypto from 'crypto';
import dialogflow from 'dialogflow';
import { Application } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import googlekey from '../config/dialog.json';
import fbkey from '../config/fb.json';

const LANGUAGE_CODE = 'en-US';


export interface IDialogflowApp {
    sessionIds: Map<any, any>;
    verifyWebHook: (mode: string, verifytoken: string) => boolean;
}



class DialogflowController implements IDialogflowApp {

    public sessionIds: Map<any, any>;

    private credentials: dialogflow.Credentials;
    private sessionClient: dialogflow.SessionsClient;

    constructor(express: Application) {
        express.use(bodyParser.json({
            verify: this.verifyRequestSignature,
        }));

        this.credentials = {
            client_email: googlekey.client_email,
            private_key: googlekey.private_key,
        };

        this.sessionClient = new dialogflow.SessionsClient({
            projectId: googlekey.project_id,
            credentials: this.credentials,
        });

        this.sessionIds = new Map();
    }

    // For facebook webhook verification
    public verifyWebHook(mode: string, verifytoken: string): boolean {
        if ( mode === 'subscribe' && verifytoken === fbkey.fb_verify_token) {
            return true;
        }
        return false;
    }

    // Verify message is from facebook app
    private verifyRequestSignature(req: IncomingMessage, res: ServerResponse, buf: Buffer) {
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
}



export default ( express: Application ) => new DialogflowController(express);
