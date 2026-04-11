function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

function waitForElement(selector, timeout = 7000) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(interval);
          resolve(el);
        }
      }, 100);
  
      setTimeout(() => {
        clearInterval(interval);
        resolve(null);
      }, timeout);
    });
  }


  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "SAVE_NOTE") {
      handleScrape(message.payload);
      return true;
    }
  });
  
  async function handleScrape(payload) {
    
   
   // TITLE (robust)
    let titleEl =
    (await waitForElement('[data-cy="question-title"]')) ||
    (await waitForElement('div.text-title-large')) ||
    (await waitForElement('h1'));

    const title = titleEl?.innerText || "Not Found";


    // TAGS (wait properly)
    await wait(500); // small buffer after title loads

    const tagElements = document.querySelectorAll('a[href*="/tag/"]');

    const tags = Array.from(tagElements)
    .map(tag => tag.innerText)
    .filter(t => t.length > 0);
  
    // CODE (Monaco fix)
    let code = "";
    const editor = document.querySelector(".monaco-editor");
  
    if (editor) {
      const lines = editor.querySelectorAll(".view-lines > div");
      code = Array.from(lines)
        .map(line => line.innerText)
        .join("\n");
    }
  
    
  
    const text = document.body.innerText;
    const match = text.match(/(\d+)\s+Submissions/i);
  
    if (match) {
      attempts = match[1];
    }
  
    console.log("====== SCRAPED DATA ======");
    console.log("Title:", title);
    console.log("Tags:", tags);
    console.log("Code:", code || "EMPTY");
    
    console.log("Approach:", payload.approach);
    console.log("Mistakes:", payload.mistakes);
  }