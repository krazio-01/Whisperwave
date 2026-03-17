const nodemailer = require('nodemailer');

const sendEmail = async (userEmail, subject, text, html) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.BREVO_HOST,
            port: process.env.BREVO_PORT,
            secure: false,
            auth: {
                user: process.env.BREVO_USER,
                pass: process.env.BREVO_PASSWORD,
            },
        });

        const mail_configs = {
            from: `"Whisperwave" <${process.env.MAIL_FROM}>`,
            to: userEmail,
            subject: subject,
        };

        if (text) mail_configs.text = text;
        if (html) mail_configs.html = html;

        const info = await transporter.sendMail(mail_configs);

        return info;
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = sendEmail;
