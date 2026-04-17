const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const emailHost = process.env.EMAIL_HOST;
  const mailPort = Number(process.env.EMAIL_PORT || 587);
  const transporter = nodemailer.createTransport(
    emailHost === "smtp.gmail.com"
      ? {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
          },
        }
      : {
          host: emailHost,
          port: mailPort,
          secure: mailPort === 465,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
          },
        },
  );

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
