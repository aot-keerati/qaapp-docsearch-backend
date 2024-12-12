const { CohereEmbeddings } = require("@langchain/cohere");
require("dotenv").config();

const embeddings = new CohereEmbeddings({
  apiKey: process.env.COHERE_API_KEY,
  model: "embed-multilingual-v3.0",
});

async function embedQuery(query) {
  return await embeddings.embedQuery(query);
}

module.exports = { embedQuery };
