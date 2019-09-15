export interface ISRecipient {
    id: string;
}

export interface ISQuickReply {
    content_type: string;
    title: string;
    payload: string | number;
    image_url?: string;       // 24 X 24
}

export interface ISButton {
    type: string;
    title?: string;
    payload?: string;
    webview_height_ratio?: string;
    url?: string;
}

export interface ISElement {
    title: string;
    subtitle?: string;
    image_url?: string;
    default_action?: any;
    buttons?: ISButton[];
}

export interface ISPayload {
    template_type?: string;
    text?: string;
    url?: string;
    buttons?: ISButton[];
    image_aspect_ratio?: string;
    elements?: ISElement[];
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
