import express = require("express");

const app = express();

const PORT = 5000;

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Server is running",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});