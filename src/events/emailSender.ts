import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export namespace emailSenderManager {
    // Configure Transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    export async function sendMail(userName: string, reason: string, email: string, eventName : string) {
        // Criando o corpo do e-mail em HTML
        const htmlContent = `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            background-color: #f4f4f4;
                            color: #333;
                            padding: 20px;
                        }
                        .email-container {
                            background-color: #fff;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            padding: 20px;
                            width: 600px;
                            margin: 0 auto;
                        }
                        h1 {
                            color: #d9534f;
                        }
                        p {
                            font-size: 16px;
                            margin-bottom: 10px;
                        }
                        .reason {
                            font-weight: bold;
                            color: #d9534f;
                        }
                        .footer {
                            margin-top: 20px;
                            font-size: 14px;
                            color: #777;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <h1>Event Rejection Notice</h1>
                        <p>Dear User,</p>
                        <p>We have reviewed your event, ${eventName}, and unfortunately, it has been <span class="reason">rejected</span>.</p>
                        <p><strong>Reason for rejection:</strong> ${reason}</p>
                        <p>This event was reviewed and rejected by <strong>${userName}</strong>.</p>
                        <div class="footer">
                            <p>If you have any questions, feel free to contact us.</p>
                            <p>Best regards,<br>PUC BET Team</p>
                        </div>
                    </div>
                </body>
            </html>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: `${email}`,
            subject: 'Your Event was Rejected',
            html: htmlContent // Corpo do e-mail em HTML
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent:', info.response);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
}
