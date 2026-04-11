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
async function createProblem(parentId, title) {
  const res = await notion.blocks.children.append({
    block_id: parentId,
    children: [
      {
        object: "block",
        type: "toggle",
        toggle: {
          rich_text: [{ type: "text", text: { content: title } }]
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

// MAIN FUNCTION
async function sendToNotion(data) {
  let patternId;

  if (cache.has(data.pattern)) {
    patternId = cache.get(data.pattern);
  } else {
    patternId = await createPattern(data.pattern);
    cache.set(data.pattern, patternId);
  }

  const problemId = await createProblem(patternId, data.title);

  const blocks = [
    text("🧠 Summary", data.ai.summary),
    text("💡 Intuition", data.ai.intuition),
    text("🪜 Approach", data.ai.approachBreakdown),
    text("⚠️ Mistake", data.ai.mistakeAnalysis),
    ...bulletList(  Array.isArray(data.ai.revisionNotes)
    ? data.ai.revisionNotes
    : [data.ai.revisionNotes])
  ];

  await notion.blocks.children.append({
    block_id: problemId,
    children: blocks
  });
  console.log("Sending to Notion:", data.title);
}

module.exports = { sendToNotion };