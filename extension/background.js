chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "OPEN_POPUP") {
      chrome.storage.local.set({
        scrapedData: message.payload
      });
  
      chrome.windows.create({
        url: "popup.html",
        type: "popup",
        width: 400,
        height: 500
      });
    }
  });