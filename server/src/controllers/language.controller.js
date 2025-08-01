import { User } from "../models/user.model.js";
import { sendEmailOTP } from "../services/emailService.js";
import { sendSMSOTP } from "../services/smsService.js";
import i18n from "../config/i18n.js";
import speakeasy from "speakeasy";
import axios from "axios";

const requestLanguageChange = async (req, res) => {
  try {
    const { language } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        message: "Unauthorized Access.",
      });
    }

    if(!language){
      return res.status(400).json({
        message: "Language is required."
      })
    }

    const supportedLanguages = ["en", "es", "hi", "pt", "zh", "fr"];
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({
        message: "Unsupported language",
      });
    }

    if (user.language === language) {
      return res.status(400).json({
        message: "You are already using this language",
      });
    }

    if (user.otpExpiry && Date.now() < user.otpExpiry) {
      return res.status(429).json({
        message: "Please wait before requesting a new OTP",
      });
    }

    if (language === "fr") {
      if (!user.email) {
        return res.status(400).json({
          message: i18n.t("email_required", { lng: "en" }),
        });
      }

      const otp = await sendEmailOTP(user.email, "fr");
      user.otpCode = otp;
      user.otpExpiry = Date.now() + 5 * 60 * 1000;
      user.otpType = "email";
      user.pendingLanguage = language;
      await user.save();

      return res.status(200).json({
        message: i18n.t("otp_sent_email", { lng: "fr" }),
        otpType: "email",
      });
    } else if (["es", "hi", "pt", "zh"].includes(language)) {
      if (!user.phoneNumber) {
        return res.status(400).json({
          message: i18n.t("phone_required", { lng: "en" }),
        });
      }

      const otp = await sendSMSOTP(user.phoneNumber, language);
      user.otpCode = otp;
      user.otpExpiry = Date.now() + 5 * 60 * 1000;
      user.otpType = "sms";
      user.pendingLanguage = language;
      await user.save();

      return res.status(200).json({
        message: i18n.t("otp_sent_sms", { lng: language }),
        otpType: "sms",
      });
    } else if (language === "en") {
      user.language = "en";
      await user.save();

      return res.status(200).json({
        message: i18n.t("language_switch_success", { lng: "en" }),
        language: "en",
      });
    }
  } catch (error) {
    console.error("Language change request error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const verifyLanguageChange = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        message: "Unauthorized Access.",
      });
    }

    if (!otp) {
      return res.status(400).json({
        message: "OTP is required",
      });
    }

    if (!user.otpCode || !user.otpExpiry || !user.pendingLanguage) {
      return res.status(400).json({
        message: i18n.t("invalid_otp", { lng: user.language || "en" }),
      });
    }

    if (Date.now() > user.otpExpiry) {
      user.otpCode = null;
      user.otpExpiry = null;
      user.otpType = null;
      user.pendingLanguage = null;
      await user.save();

      return res.status(400).json({
        message: i18n.t("otp_expired", { lng: user.language || "en" }),
      });
    }

    const isValid = speakeasy.totp.verify({
      secret: process.env.OTP_SECRET,
      token: otp,
      step: 300,
      window: 1,
    });

    if (!isValid || otp !== user.otpCode) {
      return res.status(400).json({
        message: i18n.t("invalid_otp", { lng: user.pendingLanguage || "en" }),
      });
    }

    const newLanguage = user.pendingLanguage;
    user.language = newLanguage;
    user.otpCode = null;
    user.otpExpiry = null;
    user.otpType = null;
    user.pendingLanguage = null;

    if (newLanguage === "fr") {
      user.emailVerified = true;
    } else {
      user.phoneVerified = true;
    }

    await user.save();

    return res.status(200).json({
      message: i18n.t("language_switch_success", { lng: newLanguage }),
      language: newLanguage,
    });
  } catch (error) {
    console.error("Language verification error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const dynamicTranslate = async (req, res) => {
  const { text, to, from = "en" } = req.query;
  if (!text || !to) {
    return res.status(400).json({ 
      message: "Missing text or target language." 
    });
  }
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const response = await axios.get(url);
    const translation = response.data?.responseData?.translatedText;
    if (!translation) {
      throw new Error("Translation failed");
    }
    res.json({ 
      message: "Successfully translated.",
      translation 
    });
  } catch (error) {
    console.error("Server side error while translating the dynamic contents: ",error);
    return res.status(500).json({ 
      message: error.message 
    });
  }
};

export { 
  requestLanguageChange, 
  verifyLanguageChange,
  dynamicTranslate
};
