import React, { useState } from "react";
import axios from "axios";

const PhonenumberModal = ({ onSuccess, onClose }) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\+?\d{10,15}$/.test(phone)) {
      setError("Please enter a valid phone number with country code.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:8000/api/v1/users/update-phone",
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
        <form onSubmit={handleSave}>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91xxxxxxxxxx"
            disabled={loading}
            required
            style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
          />
          {error && <div style={{ color: "red", marginBottom: "8px" }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ marginRight: "8px" }}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default PhonenumberModal;