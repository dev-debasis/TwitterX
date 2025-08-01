
export const shouldShowNotification = () => {
  // Checking if browser supports notifications or not
  if (!("Notification" in window)) {
    return false;
  }

  // Check browser permission
  const hasBrowserPermission = Notification.permission === "granted";
  
  // Checking app-level setting
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const isAppNotificationEnabled = userData.notificationsEnabled !== false;
  
  return hasBrowserPermission && isAppNotificationEnabled;
};


export const showNotification = (title, options = {}) => {
  if (!shouldShowNotification()) {
    return null;
  }

  try {
    return new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options
    });
  } catch (error) {
    console.error("Error showing notification:", error);
    return null;
  }
};


export const tweetContainsKeywords = (tweetContent) => {
  if (!tweetContent || typeof tweetContent !== "string") {
    return false;
  }
  
  const keywords = ["cricket", "science"];
  const lowerContent = tweetContent.toLowerCase();
  
  return keywords.some(keyword => lowerContent.includes(keyword));
};

export const handleTweetNotification = (tweet) => {
  if (!tweet || !tweet.content) {
    return;
  }

  if (tweetContainsKeywords(tweet.content)) {
    const notification = showNotification("New Tweet!", {
      body: tweet.content.length > 100 
        ? tweet.content.substring(0, 100) + "..." 
        : tweet.content,
      tag: `tweet-${tweet._id}`, // Prevent duplicate notifications
      requireInteraction: false,
      silent: false
    });

    // Optional: Handle notification click
    if (notification) {
      notification.onclick = () => {
        window.focus();
        // Navigate to tweet if needed
        // window.location.href = `/tweet/${tweet._id}`;
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }
};