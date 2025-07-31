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

  const handleChange = async (e) => {
    const lang = e.target.value;
    if (lang === selected) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!user.phoneNumber && lang !== "fr" && lang !== "en") {
        setPendingLang(lang);
        setShowPhone(true);
        setLoading(false);
        return;
      }
      const res = await axios.post(
        "http://localhost:8000/api/v1/language/request-change",
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
    // Reset select to current language
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
            // Fetch updated user from backend
            try {
              const token = localStorage.getItem("token");
              const res = await axios.get("http://localhost:8000/api/v1/users/profile", {
                headers: { Authorization: `Bearer ${token}` }
              });
              const updatedUser = res.data.user;
              // Update localStorage and optionally parent state
              localStorage.setItem("user", JSON.stringify(updatedUser));
              if (typeof onLanguageChange === "function") {
                onLanguageChange(updatedUser.language, updatedUser);
              }
              // Now re-trigger the language change flow
              handleChange({ target: { value: pendingLang || selected } });
            } catch (err) {
              console.log(err)
              // fallback: just try the flow again
              handleChange({ target: { value: pendingLang || selected } });
            }
          }}
          onClose={() => {
            setShowPhone(false);
            setSelected(user?.language || i18n.language || "en");
          }}
        />
      )}
    </div>
  );
}

export default LanguageSwitcher;
