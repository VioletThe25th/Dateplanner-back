const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env variables BEFORE loading services that depend on them
dotenv.config({ path: "./.env" });

const { generateDatePlan } = require("./services/openaiService");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({ message: "DatePlanner backend is running 🚀" });
});

// Future main route (LLM)
app.post("/generate-date-plan", async (req, res) => {
  try {
    const { request, places } = req.body;

    console.log("Received request:");
    console.log(request);
    console.log("Places count:", places?.length);

    if (!request || !places) {
      return res.status(400).json({ error: "Missing request or places in body" });
    }

    const plan = await generateDatePlan(request, places);
    return res.json(plan);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
