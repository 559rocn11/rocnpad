import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

function getGenAI(customApiKey?: string) {
  const key = customApiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("API Key is required. Set GEMINI_API_KEY in environment or configure your custom key in Settings.");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // API Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Route: Summarize Note
  app.post("/api/ai/summarize", async (req, res) => {
    try {
      const { title, content, type } = req.body;
      const customKey = req.headers["x-custom-api-key"] as string | undefined;
      const ai = getGenAI(customKey);

      const prompt = `You are ROCNpad's executive cognitive layer. Provide a concise, high-density summary of the following personal note/object.
Title: ${title || "Untitled"}
Type: ${type || "note"}
Content:
${content || "(No content)"}

Return response in this strict JSON format:
{
  "summary": "2-3 crisp sentences summarizing core thoughts and meaning.",
  "keyTakeaways": ["Bullet 1", "Bullet 2", "Bullet 3"],
  "suggestedTags": ["tag1", "tag2"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error("AI Summarize error:", err);
      res.status(500).json({ error: err.message || "Failed to generate summary" });
    }
  });

  // AI Route: Clean Up Note (Turn messy thoughts into structured notes while preserving original intent)
  app.post("/api/ai/cleanup", async (req, res) => {
    try {
      const { title, content } = req.body;
      const customKey = req.headers["x-custom-api-key"] as string | undefined;
      const ai = getGenAI(customKey);

      const prompt = `You are ROCNpad's thought structuring engine. Clean up the following raw capture / messy thought into a structured, clear Markdown document while preserving 100% of the user's authentic voice, specific details, technical terms, and nuances. Do not sanitize out the user's personality or add fluff.

Original Title: ${title || "Untitled"}
Raw Content:
${content || ""}

Respond in JSON:
{
  "title": "Clean, punchy title",
  "cleanedContent": "Markdown formatted body with appropriate headers, bullet points, checklists, code blocks, or sections as appropriate",
  "tags": ["extracted", "tags"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error("AI Cleanup error:", err);
      res.status(500).json({ error: err.message || "Failed to clean up note" });
    }
  });

  // AI Route: Extract Metadata (Tasks, Dates, People, Projects, Facts)
  app.post("/api/ai/extract", async (req, res) => {
    try {
      const { content, title } = req.body;
      const customKey = req.headers["x-custom-api-key"] as string | undefined;
      const ai = getGenAI(customKey);

      const prompt = `Extract all structured objects from this note:
Title: ${title}
Content:
${content}

Return JSON with exact structure:
{
  "tasks": [{"text": "task description", "due": "date string if found or null", "priority": "high"|"normal"|"low"}],
  "people": ["names of persons mentioned"],
  "projects": ["project or product names like ROCN Vision, Nomad, etc."],
  "ideas": ["distinct creative ideas identified"],
  "facts": ["important facts, credentials, specs, metrics"],
  "tags": ["relevant topic tags"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error("AI Extract error:", err);
      res.status(500).json({ error: err.message || "Failed to extract entities" });
    }
  });

  // AI Route: Connect / Suggest Related Notes
  app.post("/api/ai/connect", async (req, res) => {
    try {
      const { currentNote, allNotes } = req.body;
      const customKey = req.headers["x-custom-api-key"] as string | undefined;
      const ai = getGenAI(customKey);

      const notesIndex = (allNotes || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        type: n.type,
        tags: n.tags,
        project: n.project,
        createdAt: n.createdAt,
        snippet: (n.content || "").slice(0, 180),
      }));

      const prompt = `You are ROCNpad's associative memory engine. Analyze this active note and suggest the most meaningful connections from the user's existing knowledge base.

Active Note:
ID: ${currentNote.id}
Title: ${currentNote.title}
Tags: ${(currentNote.tags || []).join(", ")}
Project: ${currentNote.project || "None"}
Content: ${currentNote.content}

Existing Notes Repository (${notesIndex.length} items):
${JSON.stringify(notesIndex, null, 2)}

Return JSON:
{
  "relatedNotes": [
    {
      "noteId": "ID of related note",
      "relationReason": "Clear, direct reason why these connect (e.g. 'Builds upon your ROCN Vision camera pipeline notes from August 18')",
      "confidence": 0.95
    }
  ],
  "suggestedSharedTopics": ["topic1", "topic2"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error("AI Connect error:", err);
      res.status(500).json({ error: err.message || "Failed to compute connections" });
    }
  });

  // AI Route: Ask Your Knowledge (Q&A with citations)
  app.post("/api/ai/query", async (req, res) => {
    try {
      const { query, notes, dateFilter } = req.body;
      const customKey = req.headers["x-custom-api-key"] as string | undefined;
      const ai = getGenAI(customKey);

      // Provide notes corpus
      const corpus = (notes || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        type: n.type,
        createdAt: n.createdAt,
        project: n.project,
        tags: n.tags,
        content: n.content,
      }));

      const prompt = `You are ROCNpad Knowledge Intelligence. The user is asking a question about their own thoughts, notes, projects, and life records.
User Question: "${query}"
${dateFilter ? `Date Context Focus: ${dateFilter}` : ""}

User's Full Local Knowledge Base (${corpus.length} notes/records):
${JSON.stringify(corpus, null, 2)}

Instructions:
1. Answer the user accurately and directly based ONLY on their captured knowledge.
2. If they ask about a specific date (e.g., "What did I do on September 22?"), pull every entry, picture, idea, voice note, or task from that date or time period.
3. If they ask about recurring themes, neglected projects, or learnings, synthesize across all records.
4. If something wasn't captured, state it gently without guessing.
5. EVERY claim must cite the specific Note ID using markdown [Note ID: Title] and include relevant direct quotes or details.

Return response in strict JSON:
{
  "answerMarkdown": "Comprehensive, structured Markdown answer with clear sections, bullet points, and inline note citations like [Note <id>: <Title>]",
  "citedNoteIds": ["id1", "id2"],
  "matchedDates": ["YYYY-MM-DD"],
  "insights": ["Key takeaway or pattern observed across their thoughts"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error("AI Query error:", err);
      res.status(500).json({ error: err.message || "Failed to query knowledge base" });
    }
  });

  // AI Route: Today's Recap / My Day
  app.post("/api/ai/recap", async (req, res) => {
    try {
      const { todayNotes, targetDate } = req.body;
      const customKey = req.headers["x-custom-api-key"] as string | undefined;
      const ai = getGenAI(customKey);

      const prompt = `You are ROCNpad's Daily Intelligence engine. Generate a "My Day" executive recap for ${targetDate || "Today"}.
Captured Notes/Items today (${todayNotes?.length || 0} items):
${JSON.stringify(todayNotes || [], null, 2)}

Produce a crisp, inspiring summary following this exact JSON format:
{
  "headline": "Short punchy overview of the day (e.g., 'Heavy focus on ROCN Vision architecture and 5 completed tasks')",
  "totalCaptured": ${todayNotes?.length || 0},
  "breakdown": [
    {"category": "ROCN Vision / Projects", "count": 3, "description": "Offline mode & camera pipeline"},
    {"category": "Ideas", "count": 2, "description": "Biometric auth & local encryption"}
  ],
  "accomplished": ["Accomplishment 1", "Accomplishment 2"],
  "ideasHad": ["Idea 1", "Idea 2"],
  "tasksSummary": {
    "created": 2,
    "completed": 4,
    "pending": ["Unfinished item 1"]
  },
  "mostRepeatedTopic": "e.g. Offline AI / ROCN Vision",
  "dailyReflection": "2-3 thoughtful sentences tying together the trajectory of the user's day."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error("AI Recap error:", err);
      res.status(500).json({ error: err.message || "Failed to generate daily recap" });
    }
  });

  // AI Route: Look Back (Weekly / Monthly Reflection Engine)
  app.post("/api/ai/review", async (req, res) => {
    try {
      const { notes, timeframe, focusQuestion } = req.body;
      const customKey = req.headers["x-custom-api-key"] as string | undefined;
      const ai = getGenAI(customKey);

      const prompt = `You are ROCNpad's Look Back personal reflection engine.
Timeframe: ${timeframe || "This Week"}
Focus Question: ${focusQuestion || "What was I focused on and what changed?"}

User Notes Corpus for this period:
${JSON.stringify(notes || [], null, 2)}

Return JSON:
{
  "title": "Look Back: ${timeframe || "Recent Period"}",
  "coreFocus": "Primary focus area during this time",
  "recurringIdeas": ["Idea that kept appearing"],
  "neglectedProjects": ["Projects with zero or low activity that were previously active"],
  "keyLearnings": ["What the user learned or concluded"],
  "recommendedNextActions": ["What to revisit or prioritize next"],
  "narrativeSummary": "A deep, respectful 2-paragraph analysis of the user's intellectual and creative trajectory."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error("AI Review error:", err);
      res.status(500).json({ error: err.message || "Failed to generate review" });
    }
  });

  // AI Route: Audio Transcribe
  app.post("/api/ai/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      const customKey = req.headers["x-custom-api-key"] as string | undefined;
      const ai = getGenAI(customKey);

      if (!audioBase64) {
        return res.status(400).json({ error: "Missing audio data" });
      }

      const audioPart = {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: audioBase64,
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: {
          parts: [
            audioPart,
            {
              text: "Accurately transcribe this voice recording into clear, natural text. Include punctuation and paragraphs where natural. Return just the transcription.",
            },
          ],
        },
      });

      res.json({ success: true, text: response.text?.trim() || "" });
    } catch (err: any) {
      console.error("AI Transcribe error:", err);
      res.status(500).json({ error: err.message || "Transcription failed" });
    }
  });

  // AI Route: Extract Actionable Tasks from Voice Memo / Transcript
  app.post("/api/ai/extract-voice-tasks", async (req, res) => {
    try {
      const { transcript, title } = req.body;
      const customKey = req.headers["x-custom-api-key"] as string | undefined;
      const ai = getGenAI(customKey);

      if (!transcript || transcript.trim().length === 0) {
        return res.json({ success: true, tasks: [] });
      }

      const prompt = `You are ROCNpad's task intelligence engine. Analyze this spoken voice transcript and extract any direct or implied actionable to-do tasks, commitments, follow-ups, or action items mentioned by the speaker.

Spoken Transcript:
"${transcript}"

Instructions:
- Extract all clear action items as concise, punchy to-do items (e.g. "Draft Q3 proposal", "Email Sarah the revised wireframes", "Pick up lab filters").
- If a timeline or due date is mentioned (e.g. "by tomorrow", "Friday afternoon", "next week"), parse it into the 'due' field.
- Assign an appropriate priority: 'high', 'normal', or 'low'.
- If no tasks are present in the transcript, return an empty tasks array.

Respond in strict JSON format:
{
  "tasks": [
    {
      "text": "Action description",
      "due": "Optional due timeframe or null",
      "priority": "high" | "normal" | "low"
    }
  ],
  "suggestedTitle": "Short 3-5 word descriptive title for this voice note"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({ success: true, tasks: parsed.tasks || [], suggestedTitle: parsed.suggestedTitle });
    } catch (err: any) {
      console.error("AI Extract Voice Tasks error:", err);
      res.status(500).json({ error: err.message || "Failed to extract voice tasks" });
    }
  });

  // AI Route: Translate Voice Transcript / Text
  app.post("/api/ai/translate", async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      const customKey = req.headers["x-custom-api-key"] as string | undefined;
      const ai = getGenAI(customKey);

      if (!text || text.trim().length === 0) {
        return res.json({ success: true, translatedText: "" });
      }

      const prompt = `You are ROCNpad's multilingual translation intelligence. Translate the following voice note transcript accurately into ${targetLanguage || "Spanish"}.
Preserve technical terms, formatting, and tone of voice.

Original Text:
"${text}"

Respond in strict JSON:
{
  "translatedText": "Translated text in target language",
  "sourceLanguage": "Detected source language name",
  "targetLanguage": "${targetLanguage || "Spanish"}"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json({
        success: true,
        translatedText: parsed.translatedText || "",
        sourceLanguage: parsed.sourceLanguage || "Auto-detected",
        targetLanguage: parsed.targetLanguage || targetLanguage,
      });
    } catch (err: any) {
      console.error("AI Translate error:", err);
      res.status(500).json({ error: err.message || "Translation failed" });
    }
  });

  // Readwise Proxy Route: Validate Token
  app.post("/api/readwise/validate", async (req, res) => {
    try {
      const token = req.body?.token || (req.headers["authorization"] ? req.headers["authorization"].replace("Token ", "").replace("Bearer ", "") : "");
      if (!token) {
        return res.status(400).json({ error: "Missing Readwise access token" });
      }

      const response = await fetch("https://readwise.io/api/v2/auth/", {
        headers: {
          Authorization: `Token ${token.trim()}`,
        },
      });

      if (response.status === 204 || response.status === 200) {
        return res.json({ success: true, message: "Readwise token is valid" });
      } else {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: "Invalid Readwise Token. Please check your token at https://readwise.io/access_token",
          details: errorText,
        });
      }
    } catch (err: any) {
      console.error("Readwise validate error:", err);
      res.status(500).json({ error: err.message || "Failed to validate Readwise token" });
    }
  });

  // Readwise Proxy Route: Export Highlights & Books
  app.post("/api/readwise/export", async (req, res) => {
    try {
      const { token, updatedAfter, pageCursor } = req.body;
      const effectiveToken = token || (req.headers["authorization"] ? req.headers["authorization"].replace("Token ", "").replace("Bearer ", "") : "");

      if (!effectiveToken) {
        return res.status(400).json({ error: "Missing Readwise access token" });
      }

      let url = "https://readwise.io/api/v2/export/";
      const params = new URLSearchParams();
      if (updatedAfter) params.append("updatedAfter", updatedAfter);
      if (pageCursor) params.append("pageCursor", pageCursor);
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Token ${effectiveToken.trim()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `Readwise API error (${response.status})`,
          details: errorText,
        });
      }

      const data = await response.json();
      res.json({ success: true, data });
    } catch (err: any) {
      console.error("Readwise export error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch Readwise data" });
    }
  });

  // Readwise Proxy Route: Direct Books List
  app.post("/api/readwise/books", async (req, res) => {
    try {
      const { token, category, page = 1, pageSize = 50 } = req.body;
      const effectiveToken = token || (req.headers["authorization"] ? req.headers["authorization"].replace("Token ", "").replace("Bearer ", "") : "");

      if (!effectiveToken) {
        return res.status(400).json({ error: "Missing Readwise access token" });
      }

      let url = `https://readwise.io/api/v2/books/?page=${page}&page_size=${pageSize}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Token ${effectiveToken.trim()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `Readwise Books API error (${response.status})`,
          details: errorText,
        });
      }

      const data = await response.json();
      res.json({ success: true, data });
    } catch (err: any) {
      console.error("Readwise books error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch Readwise books" });
    }
  });

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ROCNpad Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
