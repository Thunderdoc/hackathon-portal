const nodemailer = require('nodemailer');

// credentials extracted from your configuration
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 465,
    secure: true,
    auth: {
        user: 'ankitraj2163@gmail.com',
        pass: 'xsmtpsib-595db44d8088c7d708d72c91809421442a195c67b63a210db326178e2ea53d23-tPMYBV3ObiP6A0EG'.trim()
    }
});

async function sendTestEmail() {
    console.log('Attempting to send test email...');
    try {
        const info = await transporter.sendMail({
            from: '"Hackathon Test" <ankitraj2163@gmail.com>',
            to: 'ankitraj2163@gmail.com', // Sending to yourself
            subject: 'Test Email from Hackathon System',
            html: '<h1>It Works!</h1><p>Your Brevo SMTP configuration is correct.</p>'
        });
        console.log('SUCCESS! Email sent.');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    } catch (error) {
        console.error('FAILED to send email:');
        console.error(error);
    }
}

sendTestEmail();
