import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

function OTPModal({ language, otpType, onSuccess, onClose }) {
  const { t } = useTranslation();
  const [otp, setOTP] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(300); // 5 minutes

  // Timer countdown effect
  useEffect(() => {
    if (timer <= 0) return;
    
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      
      const res = await axios.post(
        "http://localhost:8000/api/v1/language/verify-change",
        { otp: otp.trim() },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      // Success - call parent success handler
      onSuccess(language);
      
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err.response?.data?.message || t("invalid_otp"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      
      // Fix: Correct API endpoint URL
      await axios.post(
        "http://localhost:8000/api/v1/language/request-change",
        { language },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      // Reset timer and clear OTP input
      setTimer(300);
      setOTP("");
      
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError(err.response?.data?.message || "Error resending OTP");
    } finally {
      setResending(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOTP(value);
      if (error) setError(""); // Clear error when user starts typing
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && otp.length === 6 && !loading) {
      handleVerify();
    }
  };

  return (
    <div className="otp-modal-overlay" style={overlayStyles}>
      <div className="otp-modal-content" style={modalStyles}>
        <h3 style={{ marginBottom: '16px' }}>{t("verify")}</h3>
        
        <p style={{ marginBottom: '16px', color: '#666' }}>
          {t("enter_otp", {
            type: otpType === "email" ? t("email") : t("mobile")
          })}
        </p>

        <input
          type="text"
          value={otp}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="XXXXXX"
          maxLength={6}
          style={inputStyles}
          disabled={loading}
          autoFocus
          className="text-black font-bold"
        />

        <div style={{ marginTop: '16px' }}>
          <button 
            onClick={handleVerify} 
            disabled={loading || otp.length !== 6}
            style={{
              ...buttonStyles,
              backgroundColor: (loading || otp.length !== 6) ? '#ccc' : '#1da1f2',
              cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? t("verifying") + "..." : t("verify")}
          </button>
          
          <button 
            onClick={onClose}
            style={{ ...buttonStyles, backgroundColor: '#666', marginLeft: '8px' }}
            disabled={loading}
          >
            {t("cancel")}
          </button>
        </div>

        <div style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
          {timer > 0 ? (
            <span>Resend in {formatTimer(timer)}</span>
          ) : (
            <button 
              onClick={handleResend} 
              disabled={resending}
              style={{ 
                ...linkButtonStyles,
                cursor: resending ? 'not-allowed' : 'pointer'
              }}
            >
              {resending ? "Sending..." : t("resend_otp")}
            </button>
          )}
        </div>

        {error && (
          <div style={{ 
            color: "red", 
            marginTop: '12px', 
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalStyles = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '8px',
  minWidth: '320px',
  maxWidth: '400px',
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
};

const inputStyles = {
  width: '100%',
  padding: '12px',
  border: '2px solid #ddd',
  borderRadius: '4px',
  fontSize: '18px',
  textAlign: 'center',
  letterSpacing: '2px'
};

const buttonStyles = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '4px',
  color: 'white',
  fontSize: '14px',
  cursor: 'pointer'
};

const linkButtonStyles = {
  background: 'none',
  border: 'none',
  color: '#1da1f2',
  fontSize: '14px',
  textDecoration: 'underline'
};

export default OTPModal;