import dialogflow from 'dialogflow';
import uuid from 'uuid';
import googlekey from '../config/dialog.json';

import { IDialogflowApp } from '../types/IDialogflowApp';


class DialogflowController implements IDialogflowApp {

    public languageCode = 'en-US';
    public sessionIds: Map<string, string>;
    private credentials: dialogflow.Credentials;
    private sessionClient: dialogflow.SessionsClient;

    constructor() {
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

    public setSession(senderID: string) {
        if (!this.sessionIds.has(senderID)) {
            this.sessionIds.set(senderID, uuid.v1());
        }
    }

    public async sendToDialogflow(senderID: string, messageText: string, params?: string)
    : Promise<dialogflow.QueryResult> {

        this.setSession(senderID);

        const sessionPath = this.sessionClient.sessionPath(
            googlekey.project_id,
            this.sessionIds.get(senderID),
        );

        const request: dialogflow.DetectIntentRequest = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: messageText,
                    languageCode: this.languageCode,
                },
            },
            queryParams: {
                payload: {
                    data: params,
                },
            },
        };
        return this.sessionClient.detectIntent(request)
        .then((responses: dialogflow.DetectIntentResponse[]) => {
            return responses[0].queryResult;
        })
        .catch((err) => {
            throw err;
        });
    }
}


export default new DialogflowController();
