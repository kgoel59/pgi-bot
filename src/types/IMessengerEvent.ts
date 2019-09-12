
export interface IESender {
    id: string;
}

export interface IERecipient {
    id: string;
}

export interface IEQuickReply {
    payload: string;
}

export interface IEPayload {
    url: string;
}

export interface IEAttachment {
    type: string;
    payload: IEPayload;
}

export interface IEMessage {
    mid: string;
    is_echo?: boolean;
    app_id?: number;
    metadata?: string;
    text?: string;
    quick_reply?: IEQuickReply;
    attachments?: IEAttachment[];
}

export interface IEOptin {
    ref: string;
    user_ref: string;
}

export interface IEDelivery {
    mids: string[];
    watermark: number;
}

export interface IEAccountLinking {
    status: string;
    authorization_code?: string;
}

export interface IEReferral {
    ref: string;
    source: string;
    type: string;
}

export interface IEPostback {
    title: string;
    payload: string;
    referral: IEReferral;
}

export interface IERead {
    watermark: number;
}

export interface IEMessaging {
    sender: IESender;
    recipient: IERecipient;
    timestamp: number;
    message?: IEMessage;
    optin?: IEOptin;
    delivery?: IEDelivery;
    account_linking?: IEAccountLinking;
    postback?: IEPostback;
    read?: IERead;
}

export interface IEEntry {
    id: string;
    time: number;
    messaging: IEMessaging[];
}

export interface IMessengerEvent {
    object: string;
    entry: IEEntry[];
}

