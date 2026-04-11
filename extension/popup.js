document.getElementById("save").addEventListener("click", async () => {
    const approach = document.getElementById("approach").value;
    const mistakes = document.getElementById("mistakes").value;
  
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    chrome.tabs.sendMessage(tab.id, {
      type: "SAVE_NOTE",
      payload: { approach, mistakes }
    });

    window.close();
  });