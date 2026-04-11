const { Client } = require("@notionhq/client");

const notion = new Client({
  auth: process.env.NOTION_KEY
});


const PAGE_ID = process.env.NOTION_PAGE_ID;

const cache = new Map();

async function testAccess() {
  try {
    const res = await notion.blocks.retrieve({
      block_id: PAGE_ID
    });
    console.log("ACCESS OK ✅", res.id);
  } catch (err) {
    console.log("ACCESS FAIL ❌", err?.body || err.message);
  }
}

testAccess();


console.log("PAGE ID USED:", PAGE_ID);
// create pattern toggle
async function createPattern(pattern) {
  const res = await notion.blocks.children.append({
    block_id: PAGE_ID,
    children: [
      {
        object: "block",
        type: "toggle",
        toggle: {
          rich_text: [{ type: "text", text: { content: pattern } }]
        }
      }
    ]
  });

  return res.results[0].id;
}

// create problem toggle
async function createProblem(parentId, title, link) {
  const res = await notion.blocks.children.append({
    block_id: parentId,
    children: [
      {
        object: "block",
        type: "toggle",
        toggle: {
          rich_text: [
            {
              type: "text",
              text: {
                content: title,
                link: {
                  url: link || ""
                }
              }
            }
          ]
        }
      }
    ]
  });

  return res.results[0].id;
}

// text block
function text(title, content) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [
        { type: "text", text: { content: `${title}: ${content}` } }
      ]
    }
  };
}

// bullet list
function bulletList(items) {
  return items.map(item => ({
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [{ type: "text", text: { content: item } }]
    }
  }));
}

// Helper to find existing pattern toggle
async function findPatternBlock(pattern) {
  try {
    const res = await notion.blocks.children.list({ block_id: PAGE_ID });

    const found = res.results.find(block => {
      const txt = block.toggle?.rich_text?.[0]?.plain_text || "";
      return txt.toLowerCase() === pattern.toLowerCase();
    });

    return found ? found.id : null;
  } catch (err) {
    console.log("Pattern search failed:", err.message);
    return null;
  }
}

// MAIN FUNCTION
async function sendToNotion(data) {
  let patternId;

  if (cache.has(data.pattern)) {
    patternId = cache.get(data.pattern);
  } else {
    const existing = await findPatternBlock(data.pattern);

    if (existing) {
      patternId = existing;
    } else {
      patternId = await createPattern(data.pattern);
    }

    cache.set(data.pattern, patternId);
  }

    //title stuff
  const title = data.title.replace(" - LeetCode", "");
  const problemId = await createProblem(patternId, title, data.url);

const blocks = [

  heading("🧠 Summary"),
  text("", data.ai.summary),

  heading("💡 Intuition"),
  text("", data.ai.intuition),

  heading("🪜 Approach"),
  ...bulletList(splitSteps(data.ai.approachBreakdown)),

  heading("⚠️ Mistake"),
  text("", data.ai.mistakeAnalysis),

  heading("📌 Revision Notes"),
  ...bulletList(
    Array.isArray(data.ai.revisionNotes)
      ? data.ai.revisionNotes
      : [data.ai.revisionNotes]
  ),

  heading("💻 Code"),
  codeBlock(data.code)
];

  await notion.blocks.children.append({
    block_id: problemId,
    children: blocks
  });
  console.log("Sending to Notion:", data.title);
}

function heading(text) {
  return {
    object: "block",
    type: "heading_3",
    heading_3: {
      rich_text: [{ type: "text", text: { content: text } }]
    }
  };
}

function splitSteps(text) {
  if (!text) return [];

  return text
    .split(/\d+\.\s+/) // handles "1. ... 2. ..." inline
    .map(s => s.trim())
    .filter(Boolean);
}

function codeBlock(code) {
  return {
    object: "block",
    type: "code",
    code: {
      language: "javascript",
      rich_text: [
        {
          type: "text",
          text: { content: code || "" }
        }
      ]
    }
  };
}

module.exports = { sendToNotion };