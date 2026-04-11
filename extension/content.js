let lastResult = null;

// -------------------- SCRAPER --------------------




async function handleScrape(payload = {}) {


    const url = window.location.href;


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

  //  merge stored + incoming payload
  const stored = await chrome.storage.local.get(["tempApproach", "tempMistakes"]);

  const approach = payload.approach || stored.tempApproach || "";
  const mistakes = payload.mistakes || stored.tempMistakes || "";

  console.log("====== SCRAPED DATA ======");
  console.log("Url:", url);
  console.log("Tags:", tags);
  console.log("Code:", code);
  console.log("Approach:", approach);
  console.log("Mistakes:", mistakes);

  await fetch("http://localhost:3000/api/save", {
    method : "POST",
    headers : {'Content-Type' : 'application/json'},
    body : JSON.stringify({
        url : url,
        tags : tags,
        code : code,
        approach : approach,
        mistakes : mistakes
    })
  })

  return { url, tags, code, approach, mistakes };
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