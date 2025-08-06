import React, { useState } from "react";
import axios from "axios";

const PhonenumberModal = ({ onSuccess, onClose }) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber.startsWith('+')) {
      return {
        isValid: false,
        message: "Please enter your phone number with country code (e.g., +919876543210 for India)"
      };
    }
    
    if (!/^\+\d{10,15}$/.test(phoneNumber)) {
      return {
        isValid: false,
        message: "Please enter a valid phone number with country code (e.g., +919876543219)"
      };
    }
    
    return { isValid: true };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "https://twitterx-b7xc.onrender.com/api/v1/users/update-phone",
        { phoneNumber: phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess(phone);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save phone number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>Add Your Phone Number</h3>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>
          Please enter your phone number with country code (e.g., +919876543210)
        </p>
        <form onSubmit={handleSave}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919876543210"
            disabled={loading}
            required
            style={{ 
              width: "100%", 
              padding: "8px", 
              marginBottom: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}
          />
          {error && (
            <div style={{ 
              color: "red", 
              marginBottom: "8px", 
              fontSize: "14px",
              padding: "4px",
              backgroundColor: "#ffebee",
              border: "1px solid #ffcdd2",
              borderRadius: "4px"
            }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                padding: "8px 16px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              style={{
                padding: "8px 16px",
                backgroundColor: "#757575",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhonenumberModal;