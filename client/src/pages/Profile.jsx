import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Leftbar from "../components/ui/Leftbar.jsx";
import { useTranslation } from "react-i18next";
import TwitterTimeline from "../components/widget/Timeline.jsx";

function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [userTweets, setUserTweets] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isLoading, setIsLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const avatarInputRef = useRef();
  const coverInputRef = useRef();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchUserTweets = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://twitterx-b7xc.onrender.com/api/v1/tweets",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
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

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    const token = localStorage.getItem("token");
    const res = await fetch(
      "https://twitterx-b7xc.onrender.com/api/v1/users/update-avatar",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );
    const data = await res.json();
    setAvatarUploading(false);
    if (res.ok) {
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } else {
      alert(data.message || "Failed to update avatar");
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverUploading(true);
    const formData = new FormData();
    formData.append("coverImage", file);

    const token = localStorage.getItem("token");
    const res = await fetch(
      "https://twitterx-b7xc.onrender.com/api/v1/users/update-cover",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );
    const data = await res.json();
    setCoverUploading(false);
    if (res.ok) {
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } else {
      alert(data.message || "Failed to update cover image");
    }
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
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 bg-black/95 backdrop-blur-md border-b border-gray-800 z-30">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-full hover:bg-gray-900 transition-colors active:bg-gray-800"
            aria-label="Open menu"
          >
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Desktop Left Sidebar */}
        <div className="hidden lg:block">
          <Leftbar />
        </div>

        {/* Mobile Sidebar */}
        <div className="z-100">
          <Leftbar
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 xl:mr-80 min-h-screen">
          {/* Header with tabs - Desktop only */}
          <div className="hidden lg:block sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 z-20">
            <div className="flex-1 text-center py-4 border-b-2 border-blue-500">
              <span className="font-bold text-xl">{t("for_you")}</span>
            </div>
          </div>

          {/* Tweets Feed */}
          <div className="pb-16 lg:pb-0">
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
                  <p className="text-gray-500 text-sm">
                    {userTweets.length} {t("posts")}
                  </p>
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
                  <div className="bg-gray-700 w-full h-full"></div>
                )}
                {/* Cover upload button */}
                <button
                  className="absolute top-[80%] right-[1%] bg-black/60 p-2 rounded-full hover:bg-black/80"
                  onClick={() => coverInputRef.current.click()}
                  disabled={coverUploading}
                  title="Change cover image"
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    ref={coverInputRef}
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </button>
                {coverUploading && (
                  <div className="absolute top-[50%] left-[50%] text-xs text-blue-400">
                    Uploading...
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="px-4 pb-4">
              {/* Avatar and Edit Button */}

              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 mb-4">
                {/* Avatar Section */}
                <div className="w-32 h-32 rounded-full border-4 border-black bg-gray-600 flex items-center justify-center relative -mt-16">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-white">
                      {user?.name?.charAt(0) || "U"}
                    </span>
                  )}

                  {/* Avatar Upload Button */}
                  <button
                    className="absolute bottom-2 right-2 bg-black/60 p-2 rounded-full hover:bg-black/80"
                    onClick={() => avatarInputRef.current.click()}
                    disabled={avatarUploading}
                    title="Change profile image"
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      ref={avatarInputRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </button>

                  {/* Uploading Text */}
                  {avatarUploading && (
                    <div className="absolute top-1/2 left-1/2 text-xs text-blue-400 -translate-x-1/2 -translate-y-1/2">
                      Uploading...
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-row sm:flex-row gap-5 mt-4 md:mt-0">
                  <Link
                    to="/settings"
                    className="border border-gray-600 text-white px-6 py-2 rounded-full font-bold hover:bg-gray-900 text-center"
                  >
                    {t("edit_profile")}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold hover:bg-red-700 text-center"
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
                                  className="rounded-full object-cover"
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
                              <p className="text-white whitespace-pre-wrap mb-3">
                                {tweet.content}
                              </p>
                              {tweet.image && (
                                <div className="mb-3">
                                  <div className="relative max-w-lg">
                                    <div className="aspect-[16/9] bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
                                      <img
                                        src={tweet.image}
                                        alt="Tweet image"
                                        className="w-full h-full object-cover cursor-pointer hover:brightness-95 transition-all"
                                        onClick={() => {
                                          // Optional: Add image modal/lightbox functionality here
                                          window.open(tweet.image, "_blank");
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
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
        </div>

        {/* Right Sidebar - Desktop/Tablet only */}
        <div className="hidden xl:block w-80 fixed right-0 h-full overflow-y-auto">
          <TwitterTimeline tweetIds={["1848827977901195488"]} />
        </div>
      </div>

      {/* Mobile Navigation Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-30">
        <div className="flex items-center justify-around py-2">
          <Link
            to="/"
            className="flex flex-col items-center p-3 text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.591 7.146L12.52 1.157c-.316-.21-.724-.21-1.04 0l-9.071 5.989c-.26.173-.409.456-.409.757v13.183c0 .502.418.913.929.913H9.14c.51 0 .929-.41.929-.913v-7.075h3.909v7.075c0 .502.417.913.928.913h6.165c.511 0 .929-.41.929-.913V7.904c0-.301-.158-.584-.408-.758z" />
            </svg>
            <span className="text-xs mt-1">{t("home")}</span>
          </Link>

          <Link
            to="/profile"
            className="flex flex-col items-center p-3 text-gray-500 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <g>
                <path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z" />
              </g>
            </svg>

            <span className="text-xs mt-1">Profile</span>
          </Link>

          <a
            href="https://x.com/i/grok"
            target="_blank"
            rel="noopener noreferrer"
            to="/settings"
            className="flex flex-col items-center p-3 text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 33 32">
              <path d="M12.745 20.54l10.97-8.19c.539-.4 1.307-.244 1.564.38 1.349 3.288.746 7.241-1.938 9.955-2.683 2.714-6.417 3.31-9.83 1.954l-3.728 1.745c5.347 3.697 11.84 2.782 15.898-1.324 3.219-3.255 4.216-7.692 3.284-11.693l.008.009c-1.351-5.878.332-8.227 3.782-13.031L33 0l-4.54 4.59v-.014L12.743 20.544m-2.263 1.987c-3.837-3.707-3.175-9.446.1-12.755 2.42-2.449 6.388-3.448 9.852-1.979l3.72-1.737c-.67-.49-1.53-1.017-2.515-1.387-4.455-1.854-9.789-.931-13.41 2.728-3.483 3.523-4.579 8.94-2.697 13.561 1.405 3.454-.899 5.898-3.22 8.364C1.49 30.2.666 31.074 0 32l10.478-9.466" />
            </svg>

            <span className="text-xs mt-1">Grok</span>
          </a>

          <Link
            to="/settings"
            className="flex flex-col items-center p-3 text-gray-500 hover:text-white transition-colors"
          >
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>

            <span className="text-xs mt-1">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Profile;
