import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Settings() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("account");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileData, setProfileData] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    profession: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [browserPermission, setBrowserPermission] = useState("default");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/signin");
      return;
    }

    if (userData) {
      const userInfo = JSON.parse(userData);
      setUser(userInfo);
      setProfileData({
        name: userInfo.name || "",
        username: userInfo.username || "",
        email: userInfo.email || "",
        bio: userInfo.bio || "",
        location: userInfo.location || "",
        profession: userInfo.profession || "",
      });
      setNotificationsEnabled(userInfo.notificationsEnabled === true);
    }

    if ("Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordMessage("Password must be at least 8 characters long");
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:8000/api/v1/users/change-password",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
            confirmPassword: passwordData.confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage("Password changed successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPasswordMessage(data.message || "Failed to change password");
      }
    } catch (error) {
      setPasswordMessage("Error changing password. Please try again.");
      console.error(error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:8000/api/v1/users/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setProfileMessage("Profile updated successfully.");
        setProfileData({
          name: data.user.name,
          username: data.user.username,
          email: data.user.email,
          bio: data.user.bio,
          location: data.user.location,
          profession: data.user.profession,
        });
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        setProfileMessage(data.message || "Failed to update profile");
      }
    } catch (error) {
      setProfileMessage("An error occurred. Please try again.");
      console.error(error);
    }
  };

  const requestBrowserPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const handleNotificationToggle = async () => {
    const newValue = !notificationsEnabled;

    console.log("🔄 Toggle clicked:", {
      currentValue: notificationsEnabled,
      newValue,
      browserPermission,
    });

    if (newValue) {
      if (browserPermission === "denied") {
        alert(
          "Browser notifications are blocked. Please enable them in your browser settings."
        );
        return;
      }

      if (browserPermission === "default") {
        // Request permission first
        const granted = await requestBrowserPermission();
        if (!granted) {
          alert(
            "Browser notification permission is required to enable notifications."
          );
          return;
        }
      }
    }

    // Update state immediately for better UX
    setNotificationsEnabled(newValue);
    setNotifLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:8000/api/v1/users/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notificationsEnabled: newValue }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const finalValue =
          data.notificationsEnabled !== undefined
            ? data.notificationsEnabled
            : newValue;
        setNotificationsEnabled(finalValue);

        // Updating localStorage
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        userData.notificationsEnabled = finalValue;
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        setNotificationsEnabled(!newValue);
        console.error("Failed to update notification settings:", data);
        alert(
          `Failed to update notification settings: ${
            data.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      setNotificationsEnabled(!newValue);
      alert(
        "Error updating notification settings. Please check your connection and try again."
      );
    } finally {
      setNotifLoading(false);
    }
  };

  const getNotificationStatus = () => {
    if (browserPermission === "denied") {
      return { text: "Blocked in browser", color: "text-red-400" };
    }
    if (browserPermission === "default") {
      return { text: "Permission needed", color: "text-yellow-400" };
    }
    if (browserPermission === "granted" && notificationsEnabled) {
      return { text: "On", color: "text-green-400" };
    }
    if (browserPermission === "granted" && !notificationsEnabled) {
      return { text: "Off", color: "text-gray-400" };
    }
    return { text: "Unknown", color: "text-gray-400" };
  };

  const canToggle = () => {
    return !notifLoading && browserPermission !== "denied";
  };

  const settingsOptions = [
    {
      id: "home",
      title: "home",
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <g>
            <path d="M21.591 7.146L12.52 1.157c-.316-.21-.724-.21-1.04 0l-9.071 5.99c-.26.173-.409.456-.409.757v13.183c0 .502.418.913.929.913h6.638c.511 0 .929-.41.929-.913v-7.075h3.008v7.075c0 .502.418.913.929.913h6.639c.51 0 .928-.41.928-.913V7.904c0-.301-.158-.584-.408-.758zM20 20l-4.5.01.011-7.097c0-.502-.418-.913-.928-.913H9.44c-.511 0-.929.41-.929.913L8.5 20H4V8.773l8.011-5.342L20 8.764z" />
          </g>
        </svg>
      ),
    },
    {
      id: "account",
      title: "account",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: "privacy",
      title: "privacy_and_safety",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      id: "notifications",
      title: "notifications",
      icon: (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <g>
            <path d="M19.993 9.042C19.48 5.017 16.054 2 11.996 2s-7.49 3.021-7.999 7.051L2.866 18H7.1c.463 2.282 2.481 4 4.9 4s4.437-1.718 4.9-4h4.236l-1.143-8.958zM12 20c-1.306 0-2.417-.835-2.829-2h5.658c-.412 1.165-1.523 2-2.829 2zm-6.866-4l.847-6.698C6.364 6.272 8.941 4 11.996 4s5.627 2.268 6.013 5.295L18.864 16H5.134z" />
          </g>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Main Settings Content */}
      <div className="flex-1 ">
        {/* Header */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 z-50">
          <div className="flex items-center p-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-full hover:bg-gray-900 mr-4"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">{t("settings")}</h1>
              <p className="text-gray-500 text-sm">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Settings Navigation */}
          <div className="w-80 border-r border-gray-800 h-screen overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-bold mb-4">{t("settings")}</h2>
              <div className="space-y-1">
                {settingsOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setActiveSection(option.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-900 transition-colors ${
                      activeSection === option.id ? "bg-gray-900" : ""
                    }`}
                  >
                    {option.icon}
                    <span className="text-left">{t(option.title)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6">
            {activeSection === "home" &&
              (() => {
                navigate("/");
                return null;
              })()}
            {activeSection === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {t("account_information")}
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {t("account_info_description")}
                  </p>
                </div>

                {/* Profile Information */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">
                    {t("profile_information")}
                  </h3>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("display_name")}
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                        placeholder="Your display name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("username")}
                      </label>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            username: e.target.value,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                        placeholder="@username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("email")}
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                        placeholder="debasis@outlook.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("bio")}
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            bio: e.target.value,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                        rows="3"
                        placeholder="Tell us about yourself"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("location")}
                      </label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            location: e.target.value,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                        placeholder="Your location"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("profession")}
                      </label>
                      <input
                        type="text"
                        value={profileData.profession}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            profession: e.target.value,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                        placeholder="Software developer/Programmer/Software engineer"
                      />
                    </div>
                    <button
                      onClick={handleProfileUpdate}
                      type="submit"
                      className="cursor-pointer bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                      {t("save_changes")}
                    </button>
                    {profileMessage && (
                      <div
                        className={`mb-4 text-sm font-medium ${
                          profileMessage.includes("success")
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {profileMessage}
                      </div>
                    )}
                  </form>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-900/20 border border-red-800 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4 text-red-400">
                    {t("danger_zone")}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t("logout")}</h4>
                        <p className="text-gray-400 text-sm">
                          {t("sign_out_description")}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        {t("logout")}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{t("delete_account")}</h4>
                        <p className="text-gray-400 text-sm">
                          {t("delete_account_description")}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          alert("Account deletion feature coming soon")
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        {t("delete_account")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {t("privacy_and_safety")}
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {t("privacy_description")}
                  </p>
                </div>

                {/* Change Password */}
                <div className="bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">
                    {t("change_password")}
                  </h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("current_password")}
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("new_password")}
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t("confirm_new_password")}
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    {passwordMessage && (
                      <p
                        className={`text-sm ${
                          passwordMessage.includes("successfully")
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {passwordMessage}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isChangingPassword ? "Changing..." : "Change Password"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {t("notifications")}
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {t("notifications_description")}
                  </p>
                </div>

                <div className="bg-gray-900 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4">
                    {t("browser_notifications")}
                  </h3>

                  {/* Browser Permission Status */}
                  <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">
                        Browser Permission:
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          browserPermission === "granted"
                            ? "text-green-400"
                            : browserPermission === "denied"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {browserPermission === "granted"
                          ? "Granted"
                          : browserPermission === "denied"
                          ? "Blocked"
                          : "Not Requested"}
                      </span>
                    </div>
                  </div>

                  {/* Request Permission Button*/}
                  {browserPermission === "default" && (
                    <div className="mb-4">
                      <button
                        onClick={requestBrowserPermission}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Enable Browser Notifications
                      </button>
                      <p className="text-sm text-gray-400 mt-2">
                        Click to allow notifications from this website
                      </p>
                    </div>
                  )}

                  {/* Blocked Message */}
                  {browserPermission === "denied" && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                      <p className="text-red-400 text-sm">
                        Notifications are blocked in your browser. To enable
                        them:
                      </p>
                      <ul className="text-red-300 text-xs mt-2 ml-4 list-disc">
                        <li>Click the lock icon in your address bar</li>
                        <li>Set notifications to "Allow"</li>
                        <li>Refresh this page</li>
                      </ul>
                    </div>
                  )}

                  {/* Main Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">
                        {t("enable_browser_notifications")}
                      </span>
                      <p className="text-sm text-gray-400 mt-1">
                        Get notified when tweets contain "cricket" or "science"
                      </p>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                          notificationsEnabled ? "bg-blue-600" : "bg-gray-600"
                        } ${
                          !canToggle()
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                        onClick={handleNotificationToggle}
                        disabled={!canToggle()}
                        aria-pressed={notificationsEnabled}
                        aria-label="Toggle browser notifications"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notificationsEnabled
                              ? "translate-x-5"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span
                        className={`ml-3 text-sm ${
                          getNotificationStatus().color
                        }`}
                      >
                        {notifLoading
                          ? "Loading..."
                          : getNotificationStatus().text}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
