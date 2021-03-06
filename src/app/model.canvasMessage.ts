// Schema for the CanvasMessage class, used in collaboration

// Eazl
export class EazlCanvasMessage {
    id: number;                                     // Unique DB id
    conversation: string;                           // Conversation thread that joins msgs
    subject: string;                                // Message Subject
    body: string;                                   // Message Body text
    dashboard_id: number;                           // Optional Dashboard to which msg is linked, -1 = none
    package_id: number;                             // Optional Report to which msg is linked, -1 = none
    widget_id: number;                              // Optional Widget to which msg is linked, -1 = none
    recipients: [                                   // Array of recipients
        {
            id: number;
            username: string;                       // url of user
            is_sender: boolean;                     // True if the sender
            status: string;                         // Read /UnRead
            url: string;                            // message receipient url
        }
        ];
    is_system_generated: boolean;                   // True if a system message, not created by User'
    date_created: Date;                             // Sent on
    url: string;                                    // url of the message
}

// Canvas
export class CanvasMessage {
    canvasMessageID: number;                        // Unique DB id
    canvasMessageConversationID: string;            // Conversation thread that joins msgs
    canvasMessageSenderUserName: string;            // Created by
    canvasMessageSentDateTime: string;              // Created on
    canvasMessageIsSystemGenerated: boolean;        // True if a system message, not created by User
    canvasMessageDashboardID: number;               // Optional Dashboard to which msg is linked, -1 = none
    canvasMessageReportID: number;                  // Optional Report to which msg is linked, -1 = none
    canvasMessageWidgetID: number;                  // Optional Widget to which msg is linked, -1 = none
    canvasMessageSubject: string;                   // Message Subject
    canvasMessageBody: string;                      // Message Body text
    canvasMessageSentToMe: boolean;                 // True if this msg was sent to me, calced at Runtime
    canvasMessageMyStatus: string;                  // Read, UnRead by me, calced at Runtime
    canvasMessageRecipients: [                      // Aray of users to whom msg were sent
        {
            canvasMessageRecipientID: number;       // Recipient ID
            canvasMessageRecipientUsername: string; // UserID to whom msg was sent (groups are collapsed)
            canvasMessageRecipientIsSender: boolean;// True if this is the sender
            canvasMessageRecipientStatus: string;   // UnRead, Read - maybe more later
        }
    ];
}

// TODO - consider canvasMessageReadDateTime per Recipient

// Canvas - Flattened Version
export class CanvasMessageFlat {
    canvasMessageID: number;                        // Unique DB id
    canvasMessageConversationID: string;            // Conversation thread that joins msgs
    canvasMessageSenderUserName: string;            // Created by
    canvasMessageSentDateTime: string;              // Created on
    canvasMessageIsSystemGenerated: boolean;        // True if a system message, not created by User
    canvasMessageDashboardID: number;               // Optional Dashboard to which msg is linked, -1 = none
    canvasMessageReportID: number;                  // Optional Report to which msg is linked, -1 = none
    canvasMessageWidgetID: number;                  // Optional Widget to which msg is linked, -1 = none
    canvasMessageSubject: string;                   // Message Subject
    canvasMessageBody: string;                      // Message Body text
    canvasMessageSentToMe: boolean;                 // True if this msg was sent to me, calced at Runtime
    canvasMessageMyStatus: string;                  // Read, UnRead by me, calced at Runtime
}
