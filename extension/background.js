chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "OPEN_POPUP") {
  
      chrome.storage.local.set({
        scrapedData: message.payload
      });
  
      // get screen size
      chrome.system.display.getInfo((displays) => {
        const screen = displays[0].workArea;
  
        const width = 360;
        const height = 500;
  
        const left = screen.width - width - 20; // 20px margin
        const top = 20;
  
        chrome.windows.create({
          url: "popup.html",
          type: "popup",
          width,
          height,
          left,
          top
        });
      });
    }
  });