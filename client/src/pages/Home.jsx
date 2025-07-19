import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Leftbar from "../components/ui/Leftbar.jsx";

const containsKeywords = (content) => /cricket|science/i.test(content);

function Home() {
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
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
      setNotificationsEnabled(
        typeof userObj.notificationsEnabled === "boolean"
          ? userObj.notificationsEnabled
          : true
      );
    }
    fetchTweets();
  }, [navigate]);

  // Request browser notification permission on mount if enabled
  useEffect(() => {
    if (notificationsEnabled && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [notificationsEnabled]);

  // Fetch all tweets
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

  // Fetch replies for a tweet
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

  // Handle reply button click
  const handleReplyClick = (tweetId) => {
    if (replyingTo === tweetId) {
      setReplyingTo(null);
    } else {
      setReplyingTo(tweetId);
      fetchReplies(tweetId);
    }
  };

  // Handle posting a new tweet
  const handleTweetSubmit = async (e) => {
    e.preventDefault();
    if (!newTweet.trim()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/v1/tweets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newTweet }),
      });

      if (response.ok) {
        // Show notification for your own tweet if it matches keywords
        if (
          Notification.permission === "granted" &&
          containsKeywords(newTweet)
        ) {
          new Notification("New Tweet", {
            body: newTweet,
            icon: user?.avatar || "/favicon.ico",
          });
        }
        setNewTweet("");
        fetchTweets();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle liking a tweet
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

  // Handle replying to a tweet
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
        setReplyContent("");
        fetchTweets();
        setTweetReplies((prev) => ({ ...prev, [tweetId]: null }));
        fetchReplies(tweetId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Format tweet time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Search users
  const performSearch = async (query) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/v1/users/search?searchQuery=${encodeURIComponent(query)}`,
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

  if (isLoadingTweets) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Sidebar */}
      <Leftbar />

      {/* Middle Content */}
      <div className="flex-1 ml-64 mr-80">
        {/* Header with tabs */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-800 z-50">
          <div className="flex">
            <div className="flex-1 text-center py-4 border-b-2 border-blue-500">
              <span className="font-bold">For you</span>
            </div>
            <div className="flex-1 text-center py-4 text-gray-500 hover:bg-gray-900 cursor-pointer">
              <span>Following</span>
            </div>
          </div>
        </div>

        {/* Tweet Composer */}
        <div className="border-b border-gray-800 p-4">
          <form onSubmit={handleTweetSubmit}>
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
                <textarea
                  value={newTweet}
                  onChange={(e) => setNewTweet(e.target.value)}
                  placeholder="What is happening?!"
                  className="w-full bg-transparent text-xl placeholder-gray-500 resize-none outline-none"
                  rows="3"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4 text-blue-400">
                    {/* Tweet action buttons (icons only, no handlers) */}
                    <button type="button" className="hover:bg-blue-900/20 p-2 rounded-full">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <button type="button" className="hover:bg-blue-900/20 p-2 rounded-full">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 33 32">
                        <path d="M12.745 20.54l10.97-8.19c.539-.4 1.307-.244 1.564.38 1.349 3.288.746 7.241-1.938 9.955-2.683 2.714-6.417 3.31-9.83 1.954l-3.728 1.745c5.347 3.697 11.84 2.782 15.898-1.324 3.219-3.255 4.216-7.692 3.284-11.693l.008.009c-1.351-5.878.332-8.227 3.782-13.031L33 0l-4.54 4.59v-.014L12.743 20.544m-2.263 1.987c-3.837-3.707-3.175-9.446.1-12.755 2.42-2.449 6.388-3.448 9.852-1.979l3.72-1.737c-.67-.49-1.53-1.017-2.515-1.387-4.455-1.854-9.789-.931-13.41 2.728-3.483 3.523-4.579 8.94-2.697 13.561 1.405 3.454-.899 5.898-3.22 8.364C1.49 30.2.666 31.074 0 32l10.478-9.466" />
                      </svg>
                    </button>
                    <button type="button" className="hover:bg-blue-900/20 p-2 rounded-full">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M12 5a9 9 0 110 18 9 9 0 010-18z"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!newTweet.trim() || isLoading}
                    className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Tweets Feed */}
        <div>
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
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {tweet.userId?.avatar ? (
                      <img
                        src={tweet.userId.avatar}
                        alt={tweet.userId.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold">
                        {tweet.userId?.name?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-bold hover:underline cursor-pointer">
                        {tweet.userId?.name}
                      </h3>
                      <span className="text-gray-500">
                        @{tweet.userId?.username}
                      </span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-500">
                        {formatTime(tweet.createdAt)}
                      </span>
                      <div className="ml-auto">
                        <button className="p-2 rounded-full hover:bg-gray-800">
                          <svg
                            className="w-5 h-5 text-gray-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-white mb-3 whitespace-pre-wrap">
                      {tweet.content}
                    </p>
                    {tweet.image && (
                      <img
                        src={tweet.image}
                        alt="Tweet image"
                        className="rounded-2xl max-w-full mb-3"
                      />
                    )}
                    {/* Tweet Actions */}
                    <div className="flex items-center justify-between max-w-md">
                      <button
                        onClick={() => handleReplyClick(tweet._id)}
                        className={`flex items-center space-x-2 text-gray-500 hover:text-blue-400 group ${
                          replyingTo === tweet._id ? "text-blue-400" : ""
                        }`}
                      >
                        <div className="p-2 rounded-full group-hover:bg-blue-900/20">
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

                      <button className="flex items-center space-x-2 text-gray-500 hover:text-green-400 group">
                        <div className="p-2 rounded-full group-hover:bg-green-900/20">
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
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </div>
                        <span className="text-sm">
                          {tweet.reTweetCount || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => handleLike(tweet._id)}
                        className="flex items-center space-x-2 text-gray-500 hover:text-red-400 group"
                      >
                        <div className="p-2 rounded-full group-hover:bg-red-900/20">
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
                        </div>
                        <span className="text-sm">{tweet.likeCounts || 0}</span>
                      </button>

                      <button className="text-gray-500 hover:text-blue-400 group">
                        <div className="p-2 rounded-full group-hover:bg-blue-900/20">
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
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                            />
                          </svg>
                        </div>
                      </button>

                      <button className="text-gray-500 hover:text-blue-400 group">
                        <div className="p-2 rounded-full group-hover:bg-blue-900/20">
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
                              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                            />
                          </svg>
                        </div>
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
                                <div
                                  key={reply._id}
                                  className="flex space-x-3 bg-gray-950/30 rounded-lg p-3"
                                >
                                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    {reply.userId?.avatar ? (
                                      <img
                                        src={reply.userId.avatar}
                                        alt={reply.userId.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-sm font-bold">
                                        {reply.userId?.name?.charAt(0) || "U"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h4 className="font-bold text-sm hover:underline cursor-pointer">
                                        {reply.userId?.name}
                                      </h4>
                                      <span className="text-gray-500 text-sm">
                                        @{reply.userId?.username}
                                      </span>
                                      <span className="text-gray-500 text-sm">
                                        ·
                                      </span>
                                      <span className="text-gray-500 text-sm">
                                        {formatTime(reply.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-white text-sm whitespace-pre-wrap">
                                      {reply.content}
                                    </p>
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
                          <div className="flex-1">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder={`Reply to @${tweet.userId?.username}`}
                              className="w-full bg-transparent placeholder-gray-500 resize-none outline-none text-sm"
                              rows="2"
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={() => handleReply(tweet._id)}
                                disabled={!replyContent.trim()}
                                className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Right Sidebar with Search */}
      <div className="w-80 fixed right-0 h-full p-4 space-y-4">
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
            className="w-full bg-gray-900 border border-gray-800 rounded-full py-3 pl-10 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Search people..."
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg
                className="h-5 w-5 text-gray-400 hover:text-white"
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
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                  <p className="text-sm">No users found for "{searchQuery}"</p>
                  <p className="text-xs text-gray-500 mt-1">Try searching for a different name or username</p>
                </div>
              ) : (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    People ({searchResults.length})
                  </div>
                  {searchResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSearchResultClick(user)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold">
                            {user.name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-white">
                          {user.name}
                        </div>
                        <div className="text-gray-500 text-sm">
                          @{user.username}
                        </div>
                      </div>
                      <div className="text-gray-500">
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

        {/* Premium, Promo, and Footer */}
        <div className="bg-gray-900 rounded-2xl p-4">
          <h2 className="text-xl font-bold mb-2">Subscribe to Premium</h2>
          <p className="text-gray-400 text-sm mb-3">
            Subscribe to unlock new features and if eligible, receive a share of
            revenue.
          </p>
          <button className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-600">
            Subscribe
          </button>
        </div>
        <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-400">PROMOTED</span>
          </div>
          <h3 className="font-bold text-lg mb-2">Build Amazing Apps</h3>
          <p className="text-gray-300 text-sm mb-3">
            Start your coding journey with our comprehensive web development
            course. Learn React, Node.js, and more!
          </p>
          <div className="flex items-center justify-between">
            <span className="text-blue-400 text-sm font-medium">
              Learn More
            </span>
            <button className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm hover:bg-blue-600">
              Join Now
            </button>
          </div>
        </div>
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
          <div className="pt-2">© 2025 X Corp.</div>
        </div>
      </div>
    </div>
  );
}

export default Home;
