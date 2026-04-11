const axios = require("axios");

async function generateNotes(data) {
  try {
    const prompt = `
You are an expert DSA tutor preparing ELITE revision notes (topper-level).

Your goal:
Convert the user's attempt into deep, structured, high-quality notes that are actually useful for revision.

STRICT RULES:
- NO generic phrases like "derived from approach"
- Explain WHY the approach works
- Mention key observations explicitly
- Include edge cases and pitfalls
- Keep it concise but INFORMATION-DENSE
- Think like you're teaching someone preparing for interviews

FORMAT (RETURN ONLY VALID JSON):

{
  "summary": "What the problem is asking + core solution idea (clear and precise)",
  "intuition": "Key insight that unlocks the problem (why this approach works) in depth",
  "approachBreakdown": "Step-by-step solution with reasoning (1. 2. 3.) in decent depth",
  "mistakeAnalysis": "What mistake happened and how to avoid it",
  "pattern": "Main DSA pattern (choose from tags intelligently)",
  "revisionNotes": [
    "Key observation or trick",
    "Edge case or pitfall",
    "Optimization or alternative idea"
  ]
}

ENHANCEMENTS:
- If it's Graph → mention traversal logic + visited handling
- If DP → mention state + transition
- If Sliding Window → mention window invariant
- If Greedy → mention decision logic
- If Two Pointers → mention pointer movement logic

INPUT:
Problem: ${data.title}
Tags: ${data.tags?.join(", ") || ""}
Approach: ${data.approach}
Mistake: ${data.mistake || "None"}
Code: ${data.code || ""}
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
        // escape newlines ONLY inside JSON strings safely
        .replace(/\n/g, "\\n")
        .replace(/\t/g, " ")
        .trim();

      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");

      if (start === -1 || end === -1) return null;

      const jsonString = cleaned.slice(start, end + 1);

      try {
        return JSON.parse(jsonString);
      } catch (e) {
        // fallback cleanup for broken JSON (common in LLM output)
        const fixed = jsonString
          .replace(/\\n/g, " ")
          .replace(/\n/g, " ")
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]");

        return JSON.parse(fixed);
      }
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
    summary: data.approach || "User approach",
    intuition: data.approach || "Based on user input",
    approachBreakdown: data.approach || "Step-by-step approach not available",
    mistakeAnalysis: data.mistake || "None",
    pattern: data.tags?.join(", ") || "General",
    revisionNotes: [
      data.mistake || "Review mistakes",
      "Check edge cases",
      "Practice similar problems"
    ]
  };
}

module.exports = { generateNotes };