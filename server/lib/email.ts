import { createTransport } from "nodemailer";

// Initialize email transport
const transporter = createTransport({
  host: process.env.EMAIL_HOST || "smtp.example.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASSWORD || "",
  },
});

interface EmailConfig {
  recipients: string;
  subject?: string;
  template?: string;
}

interface EmailData {
  userName: string;
  sessionId: number;
  summary: string;
  pdfAttachment?: Buffer;
}

/**
 * Send email with PDF attachment
 */
export async function sendFactFindEmail(
  data: EmailData, 
  config: EmailConfig
): Promise<boolean> {
  try {
    const recipients = config.recipients.split(',').map(email => email.trim());
    
    if (!recipients.length) {
      throw new Error("No email recipients configured");
    }

    const subject = config.subject || `Insurance Fact Find Summary - ${data.userName}`;
    
    // Create HTML content from template or default template
    const htmlContent = config.template
      ? config.template
          .replace("{{userName}}", data.userName)
          .replace("{{sessionId}}", data.sessionId.toString())
          .replace("{{summary}}", data.summary)
      : `
        <h1>Insurance Fact Find Summary</h1>
        <p>Client: ${data.userName}</p>
        <p>Session ID: ${data.sessionId}</p>
        <h2>Responses Summary</h2>
        <div>${data.summary}</div>
        <p>Please find the complete PDF report attached.</p>
      `;

    const attachments = [];
    if (data.pdfAttachment) {
      attachments.push({
        filename: `fact-find-${data.sessionId}.pdf`,
        content: data.pdfAttachment,
      });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "insurance@example.com",
      to: recipients,
      subject,
      html: htmlContent,
      attachments,
    });

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

export default {
  sendFactFindEmail,
};
