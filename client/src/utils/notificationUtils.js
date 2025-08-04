export const shouldShowNotification = () => {
  if (!("Notification" in window)) {
    return false;
  }

  const hasBrowserPermission = Notification.permission === "granted";

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
      icon: "/favicon.png",
      badge: "/favicon.png",
      ...options,
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

  return keywords.some((keyword) => lowerContent.includes(keyword));
};

export const handleTweetNotification = (tweet) => {
  if (!tweet || !tweet.content) {
    return;
  }

  if (tweetContainsKeywords(tweet.content)) {
    const notification = showNotification("New Tweet!", {
      body:
        tweet.content.length > 100
          ? tweet.content.substring(0, 100) + "..."
          : tweet.content,
      tag: `tweet-${tweet._id}`,
      requireInteraction: false,
      silent: false,
    });

    if (notification) {
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }
};
