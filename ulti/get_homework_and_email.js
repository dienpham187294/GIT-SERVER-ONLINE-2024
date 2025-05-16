const nodemailer = require("nodemailer");

async function sendmailDK(
  subjectText,
  contentText,
  toEmail = "dienpham187294@gmail.com"
) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "dienpham187294@gmail.com",
        pass: "rqccbitaohabcrzv", // Nên lưu vào biến môi trường để bảo mật
      },
    });

    const mailOptions = {
      from: '"Cùng thực hành" <dienpham187294@gmail.com>',
      to: toEmail,
      subject: subjectText,
      html: `
        <div style="width:500px; text-align:center; border: 1px solid green; border-radius:5px; padding: 10px;">
          <h3>Cùng thực hành tiếng Anh</h3>
          <hr/>
          <h5>${contentText}</h5>
          <h1>Bạn đã nộp bài thành công!</h1>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = { sendmailDK };
