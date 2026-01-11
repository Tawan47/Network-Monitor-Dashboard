const nodemailer = require("nodemailer");
const axios = require("axios");

// Check Environment Variables
const CONFIG = {
    email: {
        host: process.env.SMTP_HOST,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        enabled: process.env.SMTP_HOST && process.env.SMTP_USER
    },
    line: {
        token: process.env.LINE_NOTIFY_TOKEN,
        enabled: !!process.env.LINE_NOTIFY_TOKEN
    },
    slack: {
        url: process.env.SLACK_WEBHOOK_URL,
        enabled: !!process.env.SLACK_WEBHOOK_URL
    },
    discord: {
        url: process.env.DISCORD_WEBHOOK_URL,
        enabled: !!process.env.DISCORD_WEBHOOK_URL
    }
};

// Email Transport
let transporter = null;
if (CONFIG.email.enabled) {
    transporter = nodemailer.createTransport({
        host: CONFIG.email.host,
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: CONFIG.email.user,
            pass: CONFIG.email.pass,
        },
    });
}

/**
 * Send Notification to all enabled channels
 * @param {string} subject - Short title/subject
 * @param {string} message - Detailed message
 */
async function sendNotification(subject, message) {
    const promises = [];

    console.log(`🔔 Notification Triggered: [${subject}] ${message}`);

    // 1. Email
    if (CONFIG.email.enabled && transporter) {
        promises.push(
            transporter.sendMail({
                from: '"Network Monitor" <monitor@example.com>',
                to: CONFIG.email.user, // Send to self for now
                subject: `[NetMon] ${subject}`,
                text: message,
            }).then(() => console.log("✅ Email sent")).catch(err => console.error("❌ Email failed", err.message))
        );
    }

    // 2. Line Notify
    if (CONFIG.line.enabled) {
        const formData = new URLSearchParams();
        formData.append('message', `\n[${subject}]\n${message}`);

        promises.push(
            axios.post('https://notify-api.line.me/api/notify', formData, {
                headers: { 'Authorization': `Bearer ${CONFIG.line.token}` }
            }).then(() => console.log("✅ Line sent")).catch(err => console.error("❌ Line failed", err.message))
        );
    }

    // 3. Slack
    if (CONFIG.slack.enabled) {
        promises.push(
            axios.post(CONFIG.slack.url, {
                text: `*${subject}*\n${message}`
            }).then(() => console.log("✅ Slack sent")).catch(err => console.error("❌ Slack failed", err.message))
        );
    }

    // 4. Discord
    if (CONFIG.discord.enabled) {
        promises.push(
            axios.post(CONFIG.discord.url, {
                content: `**${subject}**\n${message}`
            }).then(() => console.log("✅ Discord sent")).catch(err => console.error("❌ Discord failed", err.message))
        );
    }

    await Promise.allSettled(promises);
}

module.exports = { sendNotification };
