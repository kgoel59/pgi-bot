import dialogflow from 'dialogflow';
import key from '../config/dialog.json';

const LANGUAGE_CODE = 'en-US';

class DialogflowController {
    public projectId: string;
    public client: dialogflow.ClientOptions;

    private sessionClient: dialogflow.SessionsClient;
    private intentsClient: dialogflow.IntentsClient;

    constructor() {
        this.projectId = key.project_id;

        this.client = {
            credentials: {
                private_key: key.private_key,
                client_email: key.client_email,
            },
            projectId: this.projectId,
        };


        this.sessionClient = new dialogflow.SessionsClient(this.client);
        this.intentsClient = new dialogflow.IntentsClient(this.client);
    }

    public async sendTextMessage(textMessage: string, sessionId: string)
        : Promise<dialogflow.DetectIntentResponse[]> {
        const sessionPath = this.sessionClient.sessionPath(this.projectId, sessionId);

        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: textMessage,
                    languageCode: LANGUAGE_CODE,
                },
            },
        };

        return this.sessionClient.detectIntent(request)
            .then((responses) => {
                return responses;
            })
            .catch((error: Error) => {
                throw error;
            });
    }

    public async createIntent(displayName: string,
                              trainingMsgs: string[],
                              resMsgs: string[]): Promise<dialogflow.Intent[]> {
        const agentPath = this.intentsClient.projectAgentPath(this.projectId);

        const trainingPhrases: dialogflow.TrainingPhrase[] = [];

        trainingMsgs.forEach((msg) => {
            const part = {
                text: msg,
            };

            const trainingPhrase: dialogflow.TrainingPhrase = {
                type: 'EXAMPLE',
                parts: [part],
            };

            trainingPhrases.push(trainingPhrase);
        });

        const messageText: dialogflow.Text = {
            text: resMsgs,
        };

        const message: dialogflow.Message = {
            text: messageText,
            message: 'text',
        };

        const intent: dialogflow.Intent = {
            displayName,
            trainingPhrases,
            messages: [message],
        };

        const createIntentRequest: dialogflow.CreateIntentRequest = {
            parent: agentPath,
            intent,
        };

        return this.intentsClient.createIntent(createIntentRequest)
            .then((response) => {
                return response;
            })
            .catch((error: Error) => {
                throw error;
            });
    }


}

export default new DialogflowController();
