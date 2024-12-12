const axios = require("axios");
require("dotenv").config();

async function generateAnswer(query, documents) {
  const OPENAI_API = process.env.OPENAI_API;
  const docsStr = JSON.stringify(documents);
  const prompt = `
You are a Document Search Assistant for Bachelor Degree Programs of the Faculty of Science and Technology, Thammasat University, Thailand.

- Answer concisely and accurately based only on 'Relevant Documents'. Don't make up the answer beyond Relevant Docs.
- If a query goes beyond the documents, politely explain the system's limitations and state the information is unavailable.  
- Each 'Relevant Document' contains a similarity score, title (e.g., department or faculty name), and text (for generating answers).  
- Respond in the same language as the user's query.

Relevant Documents:  
${docsStr}

Query: ${query}  
Response:

  `;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message.content;
}

module.exports = { generateAnswer };
