

const OpenAI = require("openai");
const { buildPrompt } = require("./promptbuilder");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateDatePlan(request, places) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in environment variables");
  }

  const prompt = buildPrompt(request, places);

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "You are an expert assistant that generates high-quality date plans. Always return valid JSON only.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "generated_date_plan",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: {
              type: "string",
            },
            summary: {
              type: "string",
            },
            stops: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  reason: { type: "string" },
                  category: { type: "string" },
                  address: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                  order: { type: "integer" },
                  estimatedPrice: { type: "integer" },
                },
                required: [
                  "name",
                  "description",
                  "reason",
                  "category",
                  "address",
                  "latitude",
                  "longitude",
                  "order",
                  "estimatedPrice",
                ],
              },
            },
          },
          required: ["title", "summary", "stops"],
        },
      },
    },
  });

  const jsonText = response.output_text;

  if (!jsonText) {
    throw new Error("OpenAI returned an empty response");
  }

  return JSON.parse(jsonText);
}

module.exports = {
  generateDatePlan,
};