let lastResult = null;

// -------------------- SCRAPER --------------------


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



async function handleScrape(payload = {}) {

    let titleEl =
    (await waitForElement('[data-cy="question-title"]')) ||
    (await waitForElement('div.text-title-large')) ||
    (await waitForElement('h1'));

    const title = titleEl?.innerText || "Not Found";


    // TAGS (wait properly)
    // small buffer after title loads

    const tagElements = document.querySelectorAll('a[href*="/tag/"]');

    const tags = Array.from(tagElements)
    .map(tag => tag.innerText)
    .filter(t => t.length > 0);

  let code = "";
  const editor = document.querySelector(".monaco-editor");

  if (editor) {
    const lines = editor.querySelectorAll(".view-lines > div");
    code = Array.from(lines).map(line => line.innerText).join("\n");
  }

  // 🔥 merge stored + incoming payload
  const stored = await chrome.storage.local.get(["tempApproach", "tempMistakes"]);

  const approach = payload.approach || stored.tempApproach || "";
  const mistakes = payload.mistakes || stored.tempMistakes || "";

  console.log("====== SCRAPED DATA ======");
  console.log("Title:", title);
  console.log("Tags:", tags);
  console.log("Code:", code);
  console.log("Approach:", approach);
  console.log("Mistakes:", mistakes);

  return { title, tags, code, approach, mistakes };
}

// -------------------- AUTO FLOW --------------------
async function onSubmissionDetected() {
  console.log("🚀 Running auto scrape");

  const data = await handleScrape({});

  chrome.runtime.sendMessage({
    type: "OPEN_POPUP",
    payload: data
  });
}

// -------------------- OBSERVER --------------------
function observeSubmission() {
  const observer = new MutationObserver(() => {
    const resultEl = document.querySelector('[data-e2e-locator="submission-result"]');
    if (!resultEl) return;

    const text = resultEl.innerText;

    let currentResult = null;

    if (text.includes("Accepted")) currentResult = "AC";
    else if (text.includes("Wrong Answer")) currentResult = "WA";
    else if (text.includes("Runtime Error")) currentResult = "RE";
    else if (text.includes("Time Limit Exceeded")) currentResult = "TLE";

    if (currentResult && currentResult !== lastResult) {
      lastResult = currentResult;

      console.log("✅ Submission detected:", currentResult);

      onSubmissionDetected();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// -------------------- RESET ON SUBMIT --------------------
function detectSubmitClick() {
  document.addEventListener("click", (e) => {
    if (e.target.innerText === "Submit") {
      console.log("🟡 New submission started");
      lastResult = null;
    }
  });
}

// -------------------- MANUAL FLOW --------------------
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SAVE_NOTE") {
    handleScrape(message.payload);
  }
});

// -------------------- INIT --------------------
observeSubmission();
detectSubmitClick();