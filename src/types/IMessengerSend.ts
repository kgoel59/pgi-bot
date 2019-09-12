export interface ISRecipient {
    id: string;
}

export interface ISQuickReply {
    content_type: string;
    title: string;
    payload: string | number;
    image_url: string;       // 24 X 24
}


export interface ISPayload {
    url: string;
}

export interface ISAttachment {
    type: string;
    payload: ISPayload;
}

export interface ISMessage {
    text?: string;
    quick_replies?: ISQuickReply[];
    attachment?: ISAttachment;
}

export interface ISend {
    messaging_type?: string;
    recipient: ISRecipient;
    message?: ISMessage;
    sender_action?: string;
}
