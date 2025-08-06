import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import OTPModal from "./OTPModal";
import PhoneModal from "./PhonenumberModal";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "hi", label: "हिन्दी" },
  { code: "pt", label: "Português" },
  { code: "zh", label: "中文" },
  { code: "fr", label: "Français" },
];

function LanguageSwitcher({ user, onLanguageChange }) {
  const { i18n, t } = useTranslation();
  const [selected, setSelected] = useState(
    user?.language || i18n.language || "en"
  );
  const [showOTP, setShowOTP] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [pendingLang, setPendingLang] = useState(null);
  const [otpType, setOtpType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localUser, setLocalUser] = useState(user);

  const handleChange = async (e) => {
    const lang = e.target.value;
    if (lang === selected) return;
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const currentUser = localUser || user;
      
      if (!currentUser.phoneNumber && lang !== "fr" && lang !== "en") {
        setPendingLang(lang);
        setShowPhone(true);
        setLoading(false);
        return;
      }
      
      const res = await axios.post(
        "https://twitterx-b7xc.onrender.com/api/v1/language/request-change",
        { language: lang },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (lang === "en") {
        i18n.changeLanguage("en");
        setSelected("en");
        onLanguageChange && onLanguageChange("en");
        alert(t("language_switch_success"));
      } else {
        setPendingLang(lang);
        setOtpType(res.data.otpType || (lang === "fr" ? "email" : "sms"));
        setShowOTP(true);
      }
    } catch (err) {
      console.error("Language change error:", err);
      setError(err.response?.data?.message || "Error switching language");
      // Reset select to current language on error
      setSelected(user?.language || i18n.language || "en");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = (lang) => {
    i18n.changeLanguage(lang);
    setSelected(lang);
    setShowOTP(false);
    setPendingLang(null);
    setOtpType("");
    setError("");
    onLanguageChange && onLanguageChange(lang);
    alert(t("language_switch_success"));
  };

  const handleOTPClose = () => {
    setShowOTP(false);
    setPendingLang(null);
    setOtpType("");
    setError("");
    setSelected(user?.language || i18n.language || "en");
  };

  return (
    <div className="language-switcher">
      <select
        id="language-select"
        value={selected}
        onChange={handleChange}
        disabled={loading}
        className="bg-black cursor-pointer outline-0"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>

      {loading && <span style={{ marginLeft: "8px" }}>Loading...</span>}
      {error && (
        <div style={{ color: "red", marginTop: "4px", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {showOTP && (
        <OTPModal
          language={pendingLang}
          otpType={otpType}
          onSuccess={handleOTPSuccess}
          onClose={handleOTPClose}
        />
      )}

      {showPhone && (
        <PhoneModal
          onSuccess={async (savedPhone) => {
            setShowPhone(false);
            setPendingLang(null);
            
            try {
              const token = localStorage.getItem("token");
              const res = await axios.get("https://twitterx-b7xc.onrender.com/api/v1/users/profile", {
                headers: { Authorization: `Bearer ${token}` }
              });
              const updatedUser = res.data.user;
              
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setLocalUser(updatedUser);
              
              if (typeof onLanguageChange === "function") {
                onLanguageChange(updatedUser.language, updatedUser);
              }
              
              alert("Phone number saved successfully! You can now switch languages.");
              
            } catch (err) {
              console.error("Error fetching updated user profile:", err);
              const updatedLocalUser = { ...localUser, phoneNumber: savedPhone };
              setLocalUser(updatedLocalUser);
              alert("Phone number saved successfully! You can now switch languages.");
            }
          }}
          onClose={() => {
            setShowPhone(false);
            setPendingLang(null);
            setSelected(user?.language || i18n.language || "en");
          }}
        />
      )}
    </div>
  );
}

export default LanguageSwitcher;