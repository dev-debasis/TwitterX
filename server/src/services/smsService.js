import twilio from "twilio";
import speakeasy from "speakeasy";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSMSOTP = async (phone, lang = "en") => {
  const otp = speakeasy.totp({
    secret: process.env.OTP_SECRET,
    digits: 6,
    step: 300,
    window: 1,
  });

  const messages = {
    en: `Your verification code is: ${otp}. Expires in 5 minutes.`,
    es: `Tu código de verificación es: ${otp}. Expira en 5 minutos.`,
    hi: `आपका सत्यापन कोड है: ${otp}। 5 मिनट में समाप्त हो जाएगा।`,
    pt: `Seu código de verificação é: ${otp}. Expira em 5 minutos.`,
    zh: `您的验证码是: ${otp}。5分钟后过期。`,
  };

  await client.messages.create({
    body: messages[lang] || messages.en,
    from: process.env.TWILIO_PHONE,
    to: phone,
  });

  return otp;
};
