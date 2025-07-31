import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Leftbar from "../components/ui/Leftbar.jsx";
import { useTranslation } from "react-i18next";

function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [userTweets, setUserTweets] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/signin");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchUserTweets();
  }, [navigate]);

  const fetchUserTweets = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/v1/tweets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        const filteredTweets =
          data.tweets?.filter(
            (tweet) =>
              tweet.userId?._id === currentUser?.id ||
              tweet.userId?._id === currentUser?._id
          ) || [];
        setUserTweets(filteredTweets);
      }
    } catch (error) {
      console.error("Error fetching user tweets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  const formatTime = (dateString) => {
    const now = new Date();
    const tweetTime = new Date(dateString);
    const diffInSeconds = Math.floor((now - tweetTime) / 1000);

    if (diffInSeconds < 60) return "now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    return tweetTime.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Sidebar */}
      <Leftbar />
      {/* Main Profile Content */}
      <div className="flex-1 ml-64 mr-80">
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
              <h1 className="text-xl font-bold">{user?.name}</h1>
              <p className="text-gray-500 text-sm">{userTweets.length} {t("posts")}</p>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-green-500 relative">
          <div className="w-full h-full border-4 border-black bg-gray-600 flex items-center justify-center -mt-16 relative">
            {user?.coverImage ? (
              <img
                src={user.coverImage}
                alt={user.name}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="bg-gray-700"></div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-4 pb-4">
          {/* Avatar and Edit Button */}
          <div className="flex justify-between items-start mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-black bg-gray-600 flex items-center justify-center -mt-16 relative">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold">
                  {user?.name?.charAt(0) || "U"}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Link 
                to="/settings"
                className="border border-gray-600 text-white px-6 py-2 rounded-full font-bold hover:bg-gray-900 cursor-pointer">
                  {t("edit_profile")}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700 cursor-pointer"
              >
                {t("logout")}
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="mb-2">
            <div className="flex items-center gap-1">
              <h2 className="text-2xl font-bold">{user?.name}</h2>
            </div>
            <p className="text-gray-500">@{user?.username}</p>
          </div>

          {/* Bio */}
          <div className="mb-4">
            <p className="text-white leading-relaxed">{user?.bio}</p>
          </div>

          {/* Additional Info */}
          <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm mb-4">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19.5 6H17V4.5C17 3.12 15.88 2 14.5 2h-5C8.12 2 7 3.12 7 4.5V6H4.5C3.12 6 2 7.12 2 8.5v10C2 19.88 3.12 21 4.5 21h15c1.38 0 2.5-1.12 2.5-2.5v-10C22 7.12 20.88 6 19.5 6zM9 4.5c0-.28.23-.5.5-.5h5c.28 0 .5.22.5.5V6H9V4.5zm11 14c0 .28-.22.5-.5.5h-15c-.27 0-.5-.22-.5-.5v-3.04c.59.35 1.27.54 2 .54h5v1h2v-1h5c.73 0 1.41-.19 2-.54v3.04zm0-6.49c0 1.1-.9 1.99-2 1.99h-5v-1h-2v1H6c-1.1 0-2-.9-2-2V8.5c0-.28.23-.5.5-.5h15c.28 0 .5.22.5.5v3.51z" />
              </svg>
              <span>
                {user?.profession
                  ? user?.profession
                  : "Software developer/Programmer/Software engineer"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{user?.location ? user.location : "Kolkata"}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                {t("joined")}{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "1 Jun 2000"}
              </span>
            </div>
          </div>

          {/* Following/Followers */}
          <div className="flex gap-4 mb-4">
            <button className="hover:underline">
              <span className="font-bold text-white">
                {user?.followingsCount}
              </span>
              <span className="text-gray-500 ml-1">Following</span>
            </button>
            <button className="hover:underline">
              <span className="font-bold text-white">
                {user?.followersCount}
              </span>
              <span className="text-gray-500 ml-1">Followers</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-800">
            <div className="flex">
              {["Posts", "Replies", "Media", "Likes"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`flex-1 text-center py-4 hover:bg-gray-900 transition-colors ${
                    activeTab === tab.toLowerCase()
                      ? "border-b-2 border-blue-500 font-bold"
                      : "text-gray-500"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Content */}
          <div className="mt-0">
            {activeTab === "posts" && (
              <div>
                {userTweets.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-2xl mb-2">📝</div>
                    <h3 className="text-xl font-bold mb-2">No posts yet</h3>
                    <p>Start sharing your thoughts!</p>
                  </div>
                ) : (
                  userTweets.map((tweet) => (
                    <div
                      key={tweet._id}
                      className="border-b border-gray-800 p-4 hover:bg-gray-950/50 transition-colors"
                    >
                      <div className="flex space-x-3">
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold">
                              {user?.name?.charAt(0) || "U"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-bold">{user?.name}</h3>
                            <span className="text-gray-500">
                              @{user?.username}
                            </span>
                            <span className="text-gray-500">·</span>
                            <span className="text-gray-500">
                              {formatTime(tweet.createdAt)}
                            </span>
                          </div>
                          <p className="text-white whitespace-pre-wrap">
                            {tweet.content}
                          </p>
                          {tweet.image && (
                            <img
                              src={tweet.image}
                              alt="Tweet image"
                              className="rounded-2xl max-w-full mt-3"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab !== "posts" && (
              <div className="p-8 text-center text-gray-500">
                <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
                <p>This section is under development.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Right Sidebar */}
      <div className="w-80 fixed right-0 h-full p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-full py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Search"
          />
        </div>

        {/* You might like */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-xl font-bold mb-4">You might like</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">D</span>
                </div>
                <div>
                  <div className="font-bold text-sm">Debasis Khamari</div>
                  <div className="text-gray-500 text-xs">@debasis-khamari-</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">E</span>
                </div>
                <div>
                  <div className="font-bold text-sm">Debasis Khamari</div>
                  <div className="text-gray-500 text-xs">@debasis-khamari-</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">B</span>
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-1">
                    Debasis Khamari
                  </div>
                  <div className="text-gray-500 text-xs">@debasis-khamari-</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">A</span>
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-1">
                    Debasis Khamari
                  </div>
                  <div className="text-gray-500 text-xs">@debasis-khamari-</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">S</span>
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-1">
                    Debasis Khamari
                  </div>
                  <div className="text-gray-500 text-xs">@debasis-khamari-</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">I</span>
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-1">
                    Debasis Khamari
                  </div>
                  <div className="text-gray-500 text-xs">@debasis-khamari-</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">S</span>
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-1">
                    Debasis Khamari
                  </div>
                  <div className="text-gray-500 text-xs">@debasis-khamari-</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-gray-500 text-xs space-y-1 px-4">
          <div className="flex flex-wrap gap-2">
            <a href="#" className="hover:underline">
              Terms of Service
            </a>
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="hover:underline">
              Cookie Policy
            </a>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="#" className="hover:underline">
              Accessibility
            </a>
            <a href="#" className="hover:underline">
              Ads info
            </a>
            <a href="#" className="hover:underline">
              More
            </a>
          </div>
          <div className="pt-2">© 2025 Debasis Khamari</div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
