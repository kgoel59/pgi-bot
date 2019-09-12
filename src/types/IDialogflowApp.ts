import { QueryResult } from 'dialogflow';

export interface IDialogflowApp {
    sessionIds: Map<string, string>;
    sendToDialogflow: (senderID: string, messageText: string, params?: string) => Promise<QueryResult>;
}
