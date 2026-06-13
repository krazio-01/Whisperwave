const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const transporter = nodemailer.createTransport({
    host: process.env.BREVO_HOST,
    port: parseInt(process.env.BREVO_PORT || '587', 10),
    secure: false,
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASSWORD,
    },
});

const deliverSmtpEmail = async (userEmail, subject, text, html) => {
    const mail_configs = {
        from: `"Whisperwave" <${process.env.MAIL_FROM}>`,
        to: userEmail,
        subject: subject,
        text: text,
        html: html,
    };

    await transporter.sendMail(mail_configs);
};

const sendEmail = async (to, subject, templateFilename, variables = {}) => {
    try {
        const templatePath = path.join(__dirname, '../templates', templateFilename);

        const templateData = {
            ...variables,
            year: new Date().getFullYear().toString(),
        };

        const htmlContent = await ejs.renderFile(templatePath, templateData, {
            cache: process.env.NODE_ENV === 'production',
        });

        await deliverSmtpEmail(to, subject, '', htmlContent);
    } catch (error) {
        console.error(`Failed to process or send email template [${templateFilename}]:`, error);
        throw error;
    }
};

module.exports = sendEmail;
