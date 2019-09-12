
export interface ISender {
    id: string;
}

export interface IRecipient {
    id: string;
}

export interface IMessage {
    mid: string;
    text: string;
}

export interface IOptin {
    ref: string;
    user_ref: string;
}

export interface IDelivery {
    mids: string[];
    watermark: number;
}

export interface IAccountLinking {
    status: string;
    authorization_code?: string;
}

export interface IReferral {
    ref: string;
    source: string;
    type: string;
}

export interface IPostback {
    title: string;
    payload: string;
    referral: IReferral;
}

export interface IRead {
    watermark: number;
}

export interface IMessaging {
    sender: ISender;
    recipient: IRecipient;
    timestamp: number;
    message?: IMessage;
    optin?: IOptin;
    delivery?: IDelivery;
    account_linking?: IAccountLinking;
    postback?: IPostback;
    read?: IRead;
}

export interface IEntry {
    id: string;
    time: number;
    messaging: IMessaging[];
}

export interface IFacebookEvent {
    object: string;
    entry: IEntry[];
}

