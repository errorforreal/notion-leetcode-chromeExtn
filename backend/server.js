require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const { getPattern } = require("./utils/patternMap");
const { generateNotes } = require("./services/aiService");
const { sendToNotion } = require("./services/notionService");
// test route
app.get("/", (req, res) => {
  res.send("Backend running ");
});

// dummy save route
app.post("/api/save", async (req, res) => {
  try {
    const data = req.body;
    const tags = data.tags || ["Array", "HashMap"]; // 👈 fallback
    const pattern = getPattern(tags);
    
    const ai = await generateNotes({
      ...data,
      tags
    });

    const finalData = {
      ...data,
      tags,
      pattern,
      ai
    };

    await sendToNotion({
        ...data,
        pattern,
        ai
        });

    console.log("FINAL DATA:", finalData);

    res.json({ success: true, data: finalData });

  } catch (err) {
    res.status(500).json({ error: "error" });
  }
});

app.listen(3000, () => console.log("Server running on 3000"));