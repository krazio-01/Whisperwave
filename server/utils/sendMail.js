const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const sendEmail = async (userEmail, subject, text, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: process.env.SERVICE,
            port: process.env.EMAIL_PORT,
            secure: process.env.SECURE,
            auth: {
                user: process.env.USER,
                pass: process.env.PASSWORD,
            },
        });

        const mail_configs = {
            from: `"Whisperwave" <${process.env.USER}>`,
            to: userEmail,
            subject: subject,
            text: text,
            html: html,
        };

        await transporter.sendMail(mail_configs);
        return transporter;
    } 
    catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = sendEmail;
