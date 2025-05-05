const transporter = require("../config/email");

// sendEmail function (base)
async function sendEmail(to, subject, { text = "", html = "" }) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📨 Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw new Error("Email sending failed");
  }
}

// sendWelcomeEmail function
async function sendWelcomeEmail(to, username) {
  const subject = "Welcome to HUR Live Classes!";
  const html = `
    <h2>Welcome ${username}!</h2>
    <p>We're excited to have you at <b>HUR Live Classes</b>.</p>
    <p>Start exploring and join your first live session today!</p>
  `;
  const text = `Welcome ${username} to HUR Live Classes! Start exploring and join your first live session today.`;

  return sendEmail(to, subject, { text, html });
}

// sendNewClassAnnouncement function
async function sendNewClassAnnouncement(toList, classTitle) {
  const subject = "📢 New Class Available!";
  const html = `
    <h2>New Class Alert!</h2>
    <p>We've just added a new class: <b>${classTitle}</b>.</p>
    <p>Log in to <b>HUR Live Classes</b> and check it out now!</p>
    <img src="https://yourdomain.com/images/H (1).png" alt="New Class">
  `;
  const text = `New class added: ${classTitle}. Log in to HUR Live Classes and check it out!`;

  // If toList is an array, join into comma-separated string
  const recipients = Array.isArray(toList) ? toList.join(", ") : toList;

  return sendEmail(recipients, subject, { text, html });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendNewClassAnnouncement,
};
