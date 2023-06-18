const nodemailer = require("nodemailer");
module.exports.sendEmail = (email, varificationCode) => {
  return new Promise((resolve, reject) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.PASSWORD,
      },
    });

    var mailOptions = {
      from: process.env.EMAIL_ID,
      to: email,
      subject: "Varification",
      text: `varification code is ${varificationCode} `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        // resolve({err:error,status:false})
        reject(new Error("email is not send"));
      } else {
        resolve({
          info: info.response,
          status: true,
          varificationCode: varificationCode,
        });
      }
    });
  });
};
