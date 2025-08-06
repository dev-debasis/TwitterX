let serviceWorkerRegistration = null;

export const initServiceWorkerNotifications = async () => {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Worker not supported");
    return false;
  }

  try {
    const swCode = `
      console.log('SW: Service Worker started');
      
      self.addEventListener('notificationclick', function(event) {
        console.log('SW: Notification clicked');
        event.notification.close();
        
        event.waitUntil(
          clients.matchAll().then(clientList => {
            if (clientList.length > 0) {
              return clientList[0].focus();
            }
            return clients.openWindow('/');
          })
        );
      });
      
      self.addEventListener('notificationclose', function(event) {
        console.log('SW: Notification closed');
      });
    `;

    const blob = new Blob([swCode], { type: "application/javascript" });
    const swUrl = URL.createObjectURL(blob);

    serviceWorkerRegistration = await navigator.serviceWorker.register(swUrl);
    console.log("Service Worker registered successfully");
    return true;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return false;
  }
};

export const showNotificationWithSW = async (title, options = {}) => {
  if (Notification.permission !== "granted") {
    console.log("Notification permission not granted");
    return null;
  }

  try {
    console.log("Attempting direct notification...");

    const directNotification = new Notification(title, {
      body: options.body || "",
      icon: options.icon || "/favicon.png",
      tag: options.tag || `notification-${Date.now()}`,
      requireInteraction: false,
      silent: false,
    });

    let notificationShown = false;

    directNotification.onshow = () => {
      console.log("Direct notification shown");
      notificationShown = true;
    };

    directNotification.onerror = async (error) => {
      console.log("Direct notification failed, trying Service Worker: ", error);
      await tryServiceWorkerNotification(title, options);
    };

    directNotification.onclose = () => {};

    setTimeout(() => {
      try {
        directNotification.close();
      } catch (e) {
        console.log("Note: notification already closed: ", e);
      }
    }, 5000);

    setTimeout(async () => {
      if (!notificationShown) {
        console.log(
          "Direct notification didn't show, trying Service Worker..."
        );
        await tryServiceWorkerNotification(title, options);
      }
    }, 100);

    return directNotification;
  } catch (error) {
    console.error("Direct notification creation failed:", error);
    return await tryServiceWorkerNotification(title, options);
  }
};

const tryServiceWorkerNotification = async (title, options) => {
  try {
    if (!serviceWorkerRegistration) {
      const swInitialized = await initServiceWorkerNotifications();
      if (!swInitialized) {
        throw new Error("Service Worker not available");
      }
    }

    console.log("Showing notification via Service Worker...");

    await serviceWorkerRegistration.showNotification(title, {
      body: options.body || "",
      icon: options.icon || "/favicon.png",
      badge: options.badge || "/favicon.png",
      tag: options.tag || `sw-notification-${Date.now()}`,
      requireInteraction: false,
      silent: false,
      data: {
        url: window.location.href,
        timestamp: Date.now(),
      },
    });

    console.log("Service Worker notification shown");
    return { type: "service-worker", success: true };
  } catch (swError) {
    console.error("Service Worker notification also failed:", swError);

    showInPageNotification(
      title,
      options.body || "",
      options.icon || "/favicon.png"
    );
    return { type: "in-page-fallback", success: true };
  }
};

export const showInPageNotification = (
  title,
  message,
  imageUrl = "/favicon.png"
) => {
  const notification = document.createElement("div");

  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 360px;
    background: #171A1F;
    border: 1px solid #3A4857;
    border-radius: 8px;
    color: #fff;
    padding: 16px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    animation: slideIn 0.3s ease-out;
    z-index: 9999;
  `;

  notification.innerHTML = `
    <img src="${imageUrl}" alt="avatar" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" />
    <div style="flex: 1;">
      <div style="font-size: 14px; color: #aaa;">From TwitterX</div>
      <div style="font-weight: 600; font-size: 16px; margin-top: 4px;">${title}</div>
      <div style="font-size: 14px; margin: 2px 0 6px;">${message}</div>
      <div style="font-size: 12px; color: #bbb;">via Browser</div>
    </div>
    <button onclick="this.parentElement.remove()"
      style="position: absolute; top: 8px; right: 12px; 
      background: none; border: none; color: #bbb; 
      font-size: 18px; cursor: pointer;">×</button>
  `;

  if (!document.querySelector("#notification-style")) {
    const style = document.createElement("style");
    style.id = "notification-style";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = "slideIn 0.3s ease-out reverse";
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
};

export const checkNotificationSupport = () => {
  const support = {
    supported: "Notification" in window,
    permission: Notification.permission,
    serviceWorkerSupported: "serviceWorker" in navigator,
    isChrome:
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),
    isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
    documentFocused: document.hasFocus ? document.hasFocus() : true,
    documentVisible: document.visibilityState === "visible",
  };

  return support;
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting permission:", error);
    return Notification.requestPermission();
  }
};

export const shouldShowNotification = () => {
  if (!("Notification" in window)) {
    return false;
  }
  const hasBrowserPermission = Notification.permission === "granted";
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const isAppNotificationEnabled = userData.notificationsEnabled !== false;
  return hasBrowserPermission && isAppNotificationEnabled;
};

export const showNotification = async (title, options = {}) => {
  if (!shouldShowNotification()) {
    return null;
  }

  if (!serviceWorkerRegistration) {
    await initServiceWorkerNotifications();
  }

  return await showNotificationWithSW(title, options);
};

export const handleTweetNotification = async (tweet) => {
  if (!tweet || !tweet.content) {
    console.log("Invalid tweet data");
    return;
  }

  const keywords = ["cricket", "science"];
  const lowerContent = tweet.content.toLowerCase();
  const containsKeyword = keywords.some((keyword) =>
    lowerContent.includes(keyword)
  );

  if (containsKeyword) {
    console.log("Tweet contains keywords, showing notification");

    const body =
      tweet.content.length > 100
        ? tweet.content.substring(0, 100) + "..."
        : tweet.content;

    await showNotification("New Tweet!", {
      body: body,
      tag: `tweet-${tweet._id}`,
      icon: tweet.userId?.avatar || "/favicon.png",
    });
  } else {
    console.log("Tweet does not contain target keywords");
  }
};

export const testChromeNotification = async () => {
  console.log("Testing Chrome notification with all methods...");

  if (Notification.permission !== "granted") {
    alert("Please enable notifications first");
    return;
  }

  console.log("Test 1: Direct notification");
  await showNotification("Chrome Test 1", {
    body: "Testing direct notification method",
    tag: "chrome-test-1",
  });

  setTimeout(async () => {
    console.log("Test 2: Service Worker notification");
    await tryServiceWorkerNotification("Chrome Test 2", {
      body: "Testing Service Worker notification method",
      tag: "chrome-test-2",
    });
  }, 2000);

  setTimeout(() => {
    console.log("Test 3: In-page notification");
    showInPageNotification(
      "Chrome Test 3",
      "Testing in-page notification fallback"
    );
  }, 4000);
};
