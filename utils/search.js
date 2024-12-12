const { Client } = require("@elastic/elasticsearch");
require("dotenv").config();

const docSize = 5;

const elasticClient = new Client({
  node: process.env.ELASTIC_ENDP,
  auth: {
    apiKey: process.env.ELASTIC_API,
  },
});

async function searchDocuments(queryVector) {
  const searchQuery = {
    query: {
      script_score: {
        query: {
          match_all: {},
        },
        script: {
          source: "cosineSimilarity(params.query_vector, 'vector') + 1.0",
          params: { query_vector: queryVector },
        },
      },
    },
  };

  const response = await elasticClient.search({
    index: process.env.ELASTIC_INDEX,
    body: searchQuery,
    size: docSize,
  });

  return response.hits.hits.map((hit) => ({
    score: hit._score,
    title: hit._source.title,
    text: hit._source.text,
    chunk_num: hit._source.chunk_num,
  }));
}

module.exports = { searchDocuments };
