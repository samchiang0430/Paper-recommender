// server.js (ESM version)
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

// Your Gemini API key
const GEMINI_API_KEY = "YourKey";

app.use(cors());
app.use(bodyParser.json());

// API ENDPOINT
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  console.log("Received from frontend:", userMessage);

  try {
    // Use correct Gemini 2.5 Flash model
    const apiURL =
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }]
          }
        ]
      })
    });

    // Extract text safely
    const data = await response.json();
    console.log("Gemini Response JSON:", JSON.stringify(data, null, 2));

    // Extract text safely & robustly
    let reply = "[No reply received from Gemini]";

    try {
      if (Array.isArray(data?.candidates) && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        const content = candidate.content;
        let parts = null;
        if (Array.isArray(content?.parts)) {
          parts = content.parts;
        } else if (Array.isArray(content) && Array.isArray(content[0]?.parts)) {
          parts = content[0].parts;
        }

        if (Array.isArray(parts)) {
          const textPart = parts.find(p => typeof p.text === "string");
          if (textPart && typeof textPart.text === "string") {
            reply = textPart.text;
          }
        }
      }
    } catch (e) {
      console.error("Error extracting reply from Gemini response:", e);
    }

    console.log("Reply to frontend:", reply);
    res.json({ reply });

  } catch (err) {
    console.error("Backend Error:", err);
    res.status(500).json({ reply: "[Backend error while reaching Gemini API]" });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
