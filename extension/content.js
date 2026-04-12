let lastResult = null;

// -------------------- SCRAPER --------------------
async function handleScrape(payload = {}) {
  try {
    // 🔥 extension may be dead — guard early
    if (!chrome || !chrome.runtime || !chrome.runtime.id) {
      console.log("⚠️ Extension not active, abort scrape");
      return null;
    }

    const url = window.location.href;

    // tags
    const tagElements = document.querySelectorAll('a[href*="/tag/"]');
    const tags = Array.from(tagElements)
      .map(tag => tag.innerText)
      .filter(t => t.length > 0);

    // code
    let code = "";
    const editor = document.querySelector(".monaco-editor");

    if (editor) {
      const lines = editor.querySelectorAll(".view-lines > div");
      code = Array.from(lines).map(line => line.innerText).join("\n");
    }

    // 🔥 safe storage read
    let stored = {};
    try {
      if (chrome && chrome.runtime && chrome.runtime.id) {
        stored = await chrome.storage.local.get([
          "tempApproach",
          "tempMistakes"
        ]);
      }
    } catch (err) {
      console.log("⚠️ Extension context invalidated (storage)");
    }

    const approach = payload.approach || stored.tempApproach || "";
    const mistakes = payload.mistakes || stored.tempMistakes || "";

console.log("====== SCRAPED DATA ======");
console.log({ url, tags, code, approach, mistakes });

// 🔥 SEND TO BACKEND
try {
  await fetch("http://localhost:3000/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: document.title.replace(" - LeetCode", ""),
      url,
      tags,
      code,
      approach,
      mistake: mistakes
    })
  });

  console.log("✅ Sent to backend");
} catch (err) {
  console.log("❌ Failed to send to backend", err);
}

return { url, tags, code, approach, mistakes };
  } catch (err) {
    console.log("🔥 handleScrape crashed safely:", err);
    return null;
  }
}

// -------------------- AUTO FLOW --------------------
async function onSubmissionDetected() {
  console.log("🚀 Running auto scrape");

  // 🔥 open popup instantly
  try {
    if (chrome?.runtime?.id) {
      chrome.runtime.sendMessage({ type: "OPEN_POPUP" });
    }
  } catch (err) {
    console.log("⚠️ Popup not ready");
  }

  let data = null;

  try {
    // 🔥 small delay → DOM stabilizes
    await new Promise(res => setTimeout(res, 300));

    data = await handleScrape({});
  } catch (err) {
    console.log("⚠️ Scrape failed:", err);
    return;
  }

  if (!data) return;

  // 🔥 send scraped data (if popup alive)
  try {
    if (chrome?.runtime?.id) {
      chrome.runtime.sendMessage({
        type: "SCRAPED_DATA",
        payload: data
      });
    }
  } catch (err) {
    console.log("⚠️ No receiver for data");
  }
}

// -------------------- OBSERVER --------------------
function observeSubmission() {
  const observer = new MutationObserver(() => {
    const resultEl = document.querySelector(
      '[data-e2e-locator="submission-result"]'
    );
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

      observer.disconnect(); // 🔥 stop duplicate triggers

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