const nodemailer = require('nodemailer');

// A "transporter" is nodemailer's connection to an SMTP server.
// It is created lazily so dotenv has already loaded the .env values by then.
let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      // Port 465 uses TLS straight away; 587 starts plain and upgrades (STARTTLS).
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// Escape user-typed text before putting it into the HTML email body.
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Sends "your task is complete" to the given address.
// Never throws: an email problem must not break marking a task as done.
async function sendTaskCompletedEmail(to, task) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Email skipped: SMTP_USER / SMTP_PASS are not set in .env');
    return;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || `Task Manager <${process.env.SMTP_USER}>`,
      to,
      subject: `Task completed: ${task.title}`,
      text: `Nice work! You completed the task "${task.title}".\n\n${task.description}`,
      html: `
        <h2>Task completed &#10003;</h2>
        <p>Nice work! You completed the task <b>${escapeHtml(task.title)}</b>.</p>
        <p>${escapeHtml(task.description)}</p>
      `,
    });
    console.log(`Completion email sent to ${to}`);
  } catch (err) {
    console.error('Error sending completion email:', err.message);
  }
}

module.exports = { sendTaskCompletedEmail };
