import nodemailer from "nodemailer";
import speakeasy from "speakeasy";

export const sendEmailOTP = async (email, lang = "fr") => {
  try {
    const otp = speakeasy.totp({ 
      secret: process.env.OTP_SECRET, 
      digits: 6,
      step: 300,
      window: 1
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    const subjects = {
      fr: "Votre code de vérification",
      en: "Your verification code"
    };

    const messages = {
      fr: `Votre code de vérification est: ${otp}. Ce code expire dans 5 minutes.`,
      en: `Your verification code is: ${otp}. This code expires in 5 minutes.`
    };

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: subjects[lang] || subjects.en,
      text: messages[lang] || messages.en
    });

    console.log(`Email OTP sent to ${email}: ${otp}`);
    return otp;
    
  } catch (error) {
    console.error("Email service error:", error);
    throw new Error("Failed to send email OTP");
  }
};