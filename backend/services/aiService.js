const axios = require("axios");

async function generateNotes(data) {
  try {
    const prompt = `
You are a DSA revision assistant.

Convert the given problem into structured revision notes.

Rules:
- Be concise and fast
- Do NOT over-explain
- Output ONLY valid JSON

Format:
{
  "summary": "short summary",
  "intuition": "core idea in 3-4 lines",
  "approachBreakdown": "stepwise explanation in brief",
  "mistakeAnalysis": "what went wrong and fix",
  "pattern": "DSA pattern",
  "revisionNotes": "bullet points"
}

INPUT:
Problem: ${data.title}
Tags: ${data.tags?.join(", ") || ""}
Approach: ${data.approach}
Mistake: ${data.mistake || "None"}
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 8000
      }
    );


    const text =
    response.data?.choices?.[0]?.message?.content || "";


    const parsed = safeParse(text);


    if (!parsed) return fallback(data);

    console.log("raw ai response:\n", text);

    return parsed;

  } catch (err) {
    console.log("AI ERROR:", err.response?.data || err.message);
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
      // remove ```json ``` if present
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")        
        .replace(/\r/g, "")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, " ")
        .trim();

      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");

      if (start === -1 || end === -1) return null;

      const jsonString = cleaned.slice(start, end + 1);

      return JSON.parse(jsonString);
    } catch (e) {
      console.log("PARSE ERROR:", e.message);
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
    approachBreakdown: "Followed the described approach",
    mistakeAnalysis: data.mistake || "None",
    pattern: "General",
    revisionNotes: "Revise approach and edge cases"
  };
}

module.exports = { generateNotes };