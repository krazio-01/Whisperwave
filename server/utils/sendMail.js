const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const deliverSmtpEmail = async (userEmail, subject, text, html) => {
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
            text: text,
            html: html,
        };

        await transporter.sendMail(mail_configs);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

const sendEmail = async (to, subject, templateFilename, variables = {}) => {
    try {
        const templatePath = path.join(__dirname, '../templates', templateFilename);

        const templateData = {
            ...variables,
            year: new Date().getFullYear().toString(),
        };

        const htmlContent = await ejs.renderFile(templatePath, templateData);

        await deliverSmtpEmail(to, subject, '', htmlContent);
    } catch (error) {
        console.error(`Failed to process email template ${templateFilename}:`, error);
        throw error;
    }
};

module.exports = sendEmail;
