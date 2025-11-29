// file: lib/mail.ts

import nodemailer, { Transporter } from 'nodemailer';

// Pastikan environment variables sudah di-setup untuk Gmail
const emailServer = process.env.EMAIL_SERVER;
const emailFrom = process.env.EMAIL_FROM;

if (!emailServer || !emailFrom) {
    console.error("EMAIL_SERVER or EMAIL_FROM environment variables are missing!");
    // Dalam kasus nyata, Anda harus memastikan aplikasi tidak berjalan tanpa ini
}

// Nodemailer Transporter harus diinisialisasi
let transporter: Transporter | null = null;

if (emailServer) {
    try {
        // EMAIL_SERVER harus dalam format: smtps://user:pass@host:port
        transporter = nodemailer.createTransport(emailServer);
    } catch (error) {
        console.error("Failed to create Nodemailer transporter:", error);
    }
}


interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    if (!transporter) {
        throw new Error("Email service is not configured correctly.");
    }
    
    const mailOptions = {
        from: emailFrom,
        to: to,
        subject: subject,
        html: html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send notification email.");
    }
}