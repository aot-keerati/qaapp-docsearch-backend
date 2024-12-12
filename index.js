const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
require("dotenv").config();

// Import Utilities
const { embedQuery } = require("./utils/embeddings");
const { searchDocuments } = require("./utils/search");
const { generateAnswer } = require("./utils/llm");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  ),
});

const db = admin.firestore();

// Endpoint test Backend
app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

// Generate Answer endpoint.
app.post("/generate-answer", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    // Step 1: Embed Query
    const queryVector = await embedQuery(query);

    // Step 2: Search Documents
    const documents = await searchDocuments(queryVector);

    // Format Related Documents
    const formatDocuments = (documents) => {
      return documents
        .map(
          (doc) =>
            `\n- Title: ${doc.title}\n  Chunk: ${doc.chunk_num}\n  Score: ${doc.score}\n  Text: ${doc.text}`
        )
        .join("\n");
    };

    console.log(`Query: ${query}\n`);
    console.log(`Related Documents: ${formatDocuments(documents)}`);

    // Step 3: Generate Answer
    const answer = await generateAnswer(query, documents);
    ////const answer = "คำตอบที่ไม่ต้องผ่าน gpt จ้า";
    res.json({
      answer,
      related_documents: documents, // ส่งเอกสารที่ค้นพบกลับไป
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to generate answer" });
  }
});

// Feedback bot response endpoint.
app.post("/feedback", async (req, res) => {
  const { query, bot_response, action, timestamp, related_documents } =
    req.body;

  if (!query || !bot_response || !action || !timestamp) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    //// console.log(`Related Doc when preparing to upload to Cloud Firebase=: ${JSON.stringify(related_documents)}`);
    // Save the feedback in Firebase Firestore
    const feedbackData = {
      query,
      bot_response,
      action,
      timestamp,
      related_documents: Array.isArray(related_documents)
        ? related_documents.map((doc) => ({
            chunk_num: doc.chunk_num,
            score: doc.score,
            title: doc.title,
            text: doc.text,
          }))
        : [], // if related_documents doesn't array, return [].
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("QAApp_feedback").add(feedbackData);

    res.status(201).json({ message: "Feedback stored successfully" });
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(500).json({ error: "Failed to store feedback" });
  }
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
