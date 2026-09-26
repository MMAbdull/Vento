require("dotenv").config();

const express = require("express");
const cors = require("cors");

const eventRoutes = require("./routes/eventRoutes");
const connectDatabase = require("./config/database");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/events", eventRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Vento API is running",
  });
});

connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});