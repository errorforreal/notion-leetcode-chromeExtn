//  Load scraped data (auto mode)
window.addEventListener("DOMContentLoaded", async () => {

    document.getElementById("clear").addEventListener("click", () => {
        document.getElementById("approach").value = "";
        document.getElementById("mistakes").value = "";
      
        chrome.storage.local.remove(["tempApproach", "tempMistakes"]);
      });

    const result = await chrome.storage.local.get("scrapedData");
  
    const data = result.scrapedData;
  
    if (data) {
      console.log("Auto data:", data);
    }
  
    if (result.tempApproach) {
        document.getElementById("approach").value = result.tempApproach;
      }
      
      if (result.tempMistakes) {
        document.getElementById("mistakes").value = result.tempMistakes;
      }
  });
  
  //  Persist typing (optional now)
  document.getElementById("approach").addEventListener("input", (e) => {
    chrome.storage.local.set({ tempApproach: e.target.value });
  });
  
  document.getElementById("mistakes").addEventListener("input", (e) => {
    chrome.storage.local.set({ tempMistakes: e.target.value });
  });
  
  //  Manual save
  document.getElementById("save").addEventListener("click", async () => {
    const approach = document.getElementById("approach").value;
    const mistakes = document.getElementById("mistakes").value;
  
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    chrome.tabs.sendMessage(tab.id, {
      type: "SAVE_NOTE",
      payload: { approach, mistakes }
    });

    const status = document.getElementById("status");
    status.style.opacity = "1";

    setTimeout(() => {
        window.close();
      }, 1200);
  });