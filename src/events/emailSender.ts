import nodemailer from 'nodemailer';

// Configure Transporter
export namespace emailSenderManager{

        
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'puc.bet20@gmail.com',
            pass: '1234Senha'
        },
    });

    export async function sendMail(){
        const mailOptions = {
            from: 'puc.bet20@gmail.com',
            to: 'enzo.garofalo07@gmail.com',
            subject: 'teste de email com nodeJS',
            text: 'eita mundo bom!!! :)'
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent:', info.response);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

} 