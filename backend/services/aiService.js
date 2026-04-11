const axios = require("axios");

async function generateNotes(data) {
  try {
    const prompt = `
You are assisting in a system that converts LeetCode problem solving into structured DSA notes stored in Notion.

Context:
A Chrome extension captures problem data (title, tags, approach, mistake, code) after a user solves a problem.

Your job:
Convert the input into clean, structured notes for revision.

Constraints:
- Do NOT solve the problem
- Do NOT explain code in detail
- Keep it concise and useful for revision
- Focus only on structuring notes

Return ONLY valid JSON (no extra text):

{
  "summary": "1-2 line concise summary of approach",
  "intuition": "core idea behind solution in simple terms",
  "mistakeAnalysis": "analyze mistake or write None",
  "pattern": "best matching DSA pattern based on tags"
}

Input:
Problem: ${data.title}
Tags: ${data.tags?.join(", ") || ""}
Approach: ${data.approach}
Mistake: ${data.mistake || "None"}
Code: ${data.code || ""}
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { timeout: 10000 }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const parsed = safeParse(text);

    if (!parsed) return fallback(data);

    return parsed;

  } catch (err) {
    console.log("AI ERROR:", err.message);
    return fallback(data);
  }
}

/**
 * Safely parse JSON from LLM output
 */
function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");

      if (start === -1 || end === -1) return null;

      const jsonString = text.slice(start, end + 1);
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }
}

/**
 * Fallback if AI fails
 */
function fallback(data) {
  return {
    summary: data.approach || "Basic approach used",
    intuition: "Derived from approach",
    mistakeAnalysis: data.mistake || "None",
    pattern: "General"
  };
}

module.exports = { generateNotes };