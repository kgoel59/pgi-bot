import { QueryResult } from 'dialogflow';

export interface IDialogflowApp {
    sessionIds: Map<string, string>;
    setSession: (senderID: string) => void;
    sendToDialogflow: (senderID: string, messageText: string, params?: string) => Promise<QueryResult>;
}
