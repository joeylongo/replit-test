import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { runGenExecutionDetailsWorkflowStream } from "./index"; // replace with your actual file

dotenv.config();

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));

app.post("/api/chat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const input = req.body;

  for await (const step of runGenExecutionDetailsWorkflowStream(input)) {
    console.log("step", step);
    res.write(`data: ${JSON.stringify(step)}\n\n`);
  }

  res.end();
});

const server = app.listen(PORT, () => {
  console.log(`🧠 RAG server running at http://localhost:${PORT}`);
});

server.timeout = 300000;
