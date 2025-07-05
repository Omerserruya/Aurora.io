declare module 'sib-api-v3-sdk' {
  export class ApiClient {
    static instance: ApiClient;
    authentications: {
      'api-key': {
        apiKey: string;
      };
    };
  }

  export class TransactionalEmailsApi {
    sendTransacEmail(sendSmtpEmail: SendSmtpEmail): Promise<{ body: { messageId: string } }>;
  }

  export class SendSmtpEmail {
    to: Array<{ email: string }>;
    sender: { name: string; email: string };
    subject: string;
    htmlContent: string;
  }
} 