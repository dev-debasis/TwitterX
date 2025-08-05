import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Leftbar from "../components/ui/Leftbar.jsx";
import { useTranslation } from "react-i18next";
import { getTranslation } from "../api/translateApi.js";
import { handleTweetNotification } from "../utils/notificationUtils.js";
import TwitterTimeline from "../components/widget/Timeline.jsx";

function Home() {
  const { t, i18n } = useTranslation();
  const [tweets, setTweets] = useState([]);
  const [user, setUser] = useState(null);
  const [newTweet, setNewTweet] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTweets, setIsLoadingTweets] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [tweetReplies, setTweetReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [tweetTranslations, setTweetTranslations] = useState({});
  const [replyTranslations, setReplyTranslations] = useState({});
  const [translatingTweet, setTranslatingTweet] = useState(null);
  const [translatingReply, setTranslatingReply] = useState(null);
  const [tweetImage, setTweetImage] = useState(null);
  const [tweetImagePreview, setTweetImagePreview] = useState("");

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/signin");
      return;
    }

    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
    }
    fetchTweets();
  }, [navigate]);

  // Load Twitter widgets script when component mounts
  useEffect(() => {
    // Check if Twitter widgets script is already loaded
    if (!window.twttr) {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.charset = "utf-8";
      script.onload = () => {
        // Reload widgets after script loads
        if (window.twttr && window.twttr.widgets) {
          window.twttr.widgets.load();
        }
      };
      document.head.appendChild(script);
    } else {
      // If script is already loaded, just reload widgets
      window.twttr.widgets.load();
    }
  }, []);

  // Close mobile sidebar when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchTweets = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/tweets");
      const data = await response.json();
      if (response.ok) {
        setTweets(data.tweets || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingTweets(false);
    }
  };

  const fetchReplies = async (tweetId) => {
    if (tweetReplies[tweetId]) return;
    setLoadingReplies((prev) => ({ ...prev, [tweetId]: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/v1/tweets/replies/${tweetId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setTweetReplies((prev) => ({
          ...prev,
          [tweetId]: data.replies || [],
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [tweetId]: false }));
    }
  };

  const handleReplyClick = (tweetId) => {
    if (replyingTo === tweetId) {
      setReplyingTo(null);
    } else {
      setReplyingTo(tweetId);
      fetchReplies(tweetId);
    }
  };

  const handleTweetSubmit = async (e) => {
    e.preventDefault();
    if (!newTweet.trim() && !tweetImage) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("content", newTweet);
      if (tweetImage) formData.append("image", tweetImage);

      const response = await fetch("http://localhost:8000/api/v1/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const tweetForNotification = {
          _id: data.tweet?._id || Date.now(),
          content: newTweet,
          userId: user,
        };
        handleTweetNotification(tweetForNotification);
        setNewTweet("");
        setTweetImage(null);
        setTweetImagePreview("");
        fetchTweets();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (tweetId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/v1/tweets/like/${tweetId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        fetchTweets();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReply = async (tweetId) => {
    if (!replyContent.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/v1/tweets/reply/${tweetId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: replyContent }),
        }
      );
      if (response.ok) {
        const data = await response.json();

        // Hydrate userId with current user info for instant UI update
        const hydratedReply = {
          ...data.reply,
          userId: {
            _id: user._id,
            name: user.name,
            username: user.username,
            avatar: user.avatar,
          },
        };

        setTweetReplies((prev) => ({
          ...prev,
          [tweetId]: prev[tweetId]
            ? [hydratedReply, ...prev[tweetId]]
            : [hydratedReply],
        }));

        setReplyContent("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const performSearch = async (query) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/v1/users/search?searchQuery=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.users || []);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error(error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim()) {
      performSearch(e.target.value);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchResultClick = (selectedUser) => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    navigate(`/profile/${selectedUser.username}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleTranslateTweet = async (tweetId, content) => {
    setTranslatingTweet(tweetId);
    try {
      const translated = await getTranslation(content, i18n.language);
      setTweetTranslations((prev) => ({ ...prev, [tweetId]: translated }));
    } catch {
      setTweetTranslations((prev) => ({
        ...prev,
        [tweetId]: t("translation_failed"),
      }));
    } finally {
      setTranslatingTweet(null);
    }
  };

  const handleTranslateReply = async (tweetId, replyId, content) => {
    setTranslatingReply(replyId);
    try {
      const translated = await getTranslation(content, i18n.language);
      setReplyTranslations((prev) => ({
        ...prev,
        [`${tweetId}_${replyId}`]: translated,
      }));
    } catch {
      setReplyTranslations((prev) => ({
        ...prev,
        [`${tweetId}_${replyId}`]: t("translation_failed"),
      }));
    } finally {
      setTranslatingReply(null);
    }
  };

  if (isLoadingTweets) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
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
        <Leftbar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 lg:ml-64 xl:mr-80 min-h-screen">
          {/* Header with tabs - Desktop only */}
          <div className="hidden lg:block sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 z-20">
            <div className="flex-1 text-center py-4 border-b-2 border-blue-500">
              <span className="font-bold text-xl">{t("for_you")}</span>
            </div>
          </div>

          {/* Tweet Composer */}
          <div className="border-b border-gray-800 p-4">
            <form onSubmit={handleTweetSubmit}>
              <div className="flex space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-base sm:text-lg font-bold">
                      {user?.name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea
                    value={newTweet}
                    onChange={(e) => setNewTweet(e.target.value)}
                    placeholder={t("what_is_happening")}
                    className="w-full bg-transparent text-lg sm:text-xl placeholder-gray-500 resize-none outline-none border-none focus:ring-0"
                    rows="3"
                  />
                  {tweetImagePreview && (
                    <div className="mt-3">
                      <div className="relative w-full max-w-sm">
                        <div className="aspect-[16/9] bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
                          <img
                            src={tweetImagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTweetImage(null);
                            setTweetImagePreview("");
                          }}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 transition-colors"
                          title="Remove image"
                        >
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-4 text-blue-400">
                      {/* Image Upload */}
                      <input
                        type="file"
                        accept="image/*"
                        id="tweet-image-input"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          setTweetImage(file);
                          setTweetImagePreview(
                            file ? URL.createObjectURL(file) : ""
                          );
                        }}
                      />
                      <label
                        htmlFor="tweet-image-input"
                        className="cursor-pointer hover:bg-blue-900/20 p-2 rounded-full transition-colors"
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
                      </label>

                      {/* Grok Link */}
                      <a
                        href="https://x.com/i/grok"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:bg-blue-900/20 p-2 rounded-full transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 33 32"
                        >
                          <path d="M12.745 20.54l10.97-8.19c.539-.4 1.307-.244 1.564.38 1.349 3.288.746 7.241-1.938 9.955-2.683 2.714-6.417 3.31-9.83 1.954l-3.728 1.745c5.347 3.697 11.84 2.782 15.898-1.324 3.219-3.255 4.216-7.692 3.284-11.693l.008.009c-1.351-5.878.332-8.227 3.782-13.031L33 0l-4.54 4.59v-.014L12.743 20.544m-2.263 1.987c-3.837-3.707-3.175-9.446.1-12.755 2.42-2.449 6.388-3.448 9.852-1.979l3.72-1.737c-.67-.49-1.53-1.017-2.515-1.387-4.455-1.854-9.789-.931-13.41 2.728-3.483 3.523-4.579 8.94-2.697 13.561 1.405 3.454-.899 5.898-3.22 8.364C1.49 30.2.666 31.074 0 32l10.478-9.466" />
                        </svg>
                      </a>
                    </div>
                    <button
                      type="submit"
                      disabled={(!newTweet.trim() && !tweetImage) || isLoading}
                      className="bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-full font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                    >
                      {isLoading ? t("posting") : t("post")}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Tweets Feed */}
          <div className="pb-16 lg:pb-0">
            {tweets.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-2xl mb-2">🐦</div>
                <h3 className="text-xl font-bold mb-2">No tweets yet</h3>
                <p>Be the first to share something!</p>
              </div>
            ) : (
              tweets.map((tweet) => (
                <div
                  key={tweet._id}
                  className="border-b border-gray-800 p-4 hover:bg-gray-950/50 transition-colors"
                >
                  <div className="flex space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {tweet.userId?.avatar ? (
                        <img
                          src={tweet.userId.avatar}
                          alt={tweet.userId.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-base sm:text-lg font-bold">
                          {tweet.userId?.name?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1 flex-wrap">
                        <h3 className="font-bold hover:underline cursor-pointer truncate">
                          {tweet.userId?.name}
                        </h3>
                        <span className="text-gray-500 truncate">
                          @{tweet.userId?.username}
                        </span>
                        <span className="text-gray-500 hidden sm:inline">
                          ·
                        </span>
                        <span className="text-gray-500 text-sm">
                          {formatTime(tweet.createdAt)}
                        </span>
                      </div>
                      <p className="text-white mb-3 whitespace-pre-wrap break-words">
                        {tweet.content}
                      </p>

                      {tweet.image && (
                        <div className="mb-3">
                          <div className="relative max-w-full sm:max-w-lg">
                            <div className="aspect-[16/9] bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
                              <img
                                src={tweet.image}
                                alt="Tweet image"
                                className="w-full h-full object-cover cursor-pointer hover:brightness-95 transition-all"
                                onClick={() => {
                                  window.open(tweet.image, "_blank");
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Translation Button */}
                      <div className="mb-3">
                        <button
                          className="text-blue-400 underline text-xs hover:text-blue-300 transition-colors"
                          onClick={() =>
                            handleTranslateTweet(tweet._id, tweet.content)
                          }
                          disabled={translatingTweet === tweet._id}
                        >
                          {translatingTweet === tweet._id
                            ? t("loading")
                            : t("translate")}
                        </button>
                        {tweetTranslations[tweet._id] && (
                          <div className="text-green-300 text-sm mt-1 break-words">
                            {tweetTranslations[tweet._id]}
                          </div>
                        )}
                      </div>

                      {/* Tweet Actions */}
                      <div className="flex items-center space-x-6 sm:space-x-10 max-w-md">
                        <button
                          onClick={() => handleLike(tweet._id)}
                          className={`cursor-pointer flex items-center space-x-2 ${
                            tweet.likedBy?.includes(user._id)
                              ? "text-red-400"
                              : "text-gray-500 hover:text-red-400"
                          } group transition-colors`}
                        >
                          <div className="p-2 rounded-full group-hover:bg-red-900/20 transition-colors">
                            {tweet.likedBy?.includes(user._id) ? (
                              <svg
                                className="w-5 h-5 fill-red-400"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                              </svg>
                            ) : (
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
                                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm">
                            {tweet.likeCounts || 0}
                          </span>
                        </button>

                        <button
                          onClick={() => handleReplyClick(tweet._id)}
                          className={`cursor-pointer flex items-center space-x-2 text-gray-500 hover:text-blue-400 group ${
                            replyingTo === tweet._id
                              ? "text-blue-400"
                              : "text-gray-500"
                          } transition-colors`}
                        >
                          <div className="p-2 rounded-full group-hover:bg-blue-900/20 transition-colors">
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
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                          </div>
                          <span className="text-sm">
                            {tweet.repliesCount || 0}
                          </span>
                        </button>
                      </div>

                      {/* Replies Section */}
                      {replyingTo === tweet._id && (
                        <div className="mt-4 border-t border-gray-800 pt-4">
                          {loadingReplies[tweet._id] && (
                            <div className="flex items-center justify-center py-4">
                              <div className="text-gray-500">
                                Loading replies...
                              </div>
                            </div>
                          )}
                          {tweetReplies[tweet._id] && (
                            <div className="space-y-3 mb-4">
                              {tweetReplies[tweet._id].length === 0 ? (
                                <div className="text-gray-500 text-sm text-center py-2">
                                  No replies yet. Be the first to reply!
                                </div>
                              ) : (
                                tweetReplies[tweet._id].map((reply) => (
                                  <div key={reply._id}>
                                    <div className="flex space-x-3 bg-gray-950/30 rounded-lg p-3">
                                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        {reply.userId?.avatar ? (
                                          <img
                                            src={reply.userId.avatar}
                                            alt={reply.userId.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-sm font-bold">
                                            {reply.userId?.name?.charAt(0) ||
                                              "U"}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1 flex-wrap">
                                          <h4 className="font-bold text-sm hover:underline cursor-pointer truncate">
                                            {reply.userId?.name}
                                          </h4>
                                          <span className="text-gray-500 text-sm truncate">
                                            @{reply.userId?.username}
                                          </span>
                                          <span className="text-gray-500 text-sm hidden sm:inline">
                                            ·
                                          </span>
                                          <span className="text-gray-500 text-sm">
                                            {formatTime(reply.createdAt)}
                                          </span>
                                        </div>
                                        <p className="text-white text-sm whitespace-pre-wrap break-words">
                                          {reply.content}
                                        </p>

                                        <div className="mt-2">
                                          <button
                                            className="text-blue-400 underline text-xs hover:text-blue-300 transition-colors"
                                            onClick={() =>
                                              handleTranslateReply(
                                                tweet._id,
                                                reply._id,
                                                reply.content
                                              )
                                            }
                                            disabled={
                                              translatingReply === reply._id
                                            }
                                          >
                                            {translatingReply === reply._id
                                              ? t("loading")
                                              : t("translate")}
                                          </button>
                                          {replyTranslations[
                                            `${tweet._id}_${reply._id}`
                                          ] && (
                                            <div className="text-green-300 text-xs mt-1 break-words">
                                              {
                                                replyTranslations[
                                                  `${tweet._id}_${reply._id}`
                                                ]
                                              }
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {/* Reply Composer */}
                          <div className="flex space-x-3 border-t border-gray-700 pt-3">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                              {user?.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold">
                                  {user?.name?.charAt(0) || "U"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <textarea
                                value={replyContent}
                                onChange={(e) =>
                                  setReplyContent(e.target.value)
                                }
                                placeholder={`Reply to @${tweet.userId?.username}`}
                                className="w-full bg-transparent placeholder-gray-500 resize-none outline-none text-sm border-none focus:ring-0"
                                rows="2"
                              />
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={() => handleReply(tweet._id)}
                                  disabled={!replyContent.trim()}
                                  className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Reply
                                </button>
                              </div>
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
        </div>

        {/* Right Sidebar with Search and Twitter Embed - Desktop/Tablet only */}
        <div className="hidden xl:block w-80 fixed right-0 h-full overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Search Bar */}
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
                onChange={handleSearchInputChange}
                className="w-full bg-gray-900 border border-gray-800 rounded-full py-3 pl-10 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder={t("search")}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="h-5 w-5 text-gray-400 hover:text-white transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-400">
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
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
                        Searching...
                      </div>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      <svg
                        className="w-12 h-12 mx-auto mb-2 text-gray-600"
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
                      <p className="text-sm">
                        No users found for "{searchQuery}"
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Try searching for a different name or username
                      </p>
                    </div>
                  ) : (
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                        People ({searchResults.length})
                      </div>
                      {searchResults.map((searchUser) => (
                        <button
                          key={searchUser._id}
                          onClick={() => handleSearchResultClick(searchUser)}
                          className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 transition-colors"
                        >
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                            {searchUser.avatar ? (
                              <img
                                src={searchUser.avatar}
                                alt={searchUser.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold">
                                {searchUser.name?.charAt(0) || "U"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-bold text-white truncate">
                              {searchUser.name}
                            </div>
                            <div className="text-gray-500 text-sm truncate">
                              @{searchUser.username}
                            </div>
                          </div>
                          <div className="text-gray-500 flex-shrink-0">
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
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Twitter Timeline */}
            <div className="bg-gray-900 rounded-2xl p-4">
              <h2 className="text-xl font-bold mb-4">Latest from X</h2>
              <TwitterTimeline tweetIds={["1848829388747641049"]} />
            </div>

            {/* Footer */}
            <div className="text-gray-500 text-xs space-y-2 px-4">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <a href="#" className="hover:underline">
                  Terms of Service
                </a>
                <a href="#" className="hover:underline">
                  Privacy Policy
                </a>
                <a href="#" className="hover:underline">
                  Cookie Policy
                </a>
                <a href="#" className="hover:underline">
                  Accessibility
                </a>
                <a href="#" className="hover:underline">
                  Ads info
                </a>
                <span>More ...</span>
              </div>
              <div>© 2024 X Corp.</div>
            </div>
          </div>
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

export default Home;
