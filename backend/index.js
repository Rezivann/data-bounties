require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { client } = require("./hedera");
const db = require("./database");
const path = require("path");

const bountyRoutes = require("./routes/bounties");
const submissionRoutes = require("./routes/submissions");
const portfolioRoutes = require("./routes/portfolio");




const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(process.env.UPLOAD_DIR || path.join(__dirname, "uploads")));
app.use("/bounties", bountyRoutes);
app.use("/submissions", submissionRoutes);
app.use("/portfolio", portfolioRoutes);

app.get("/health", (req, res) => { console.log("Health check hit"); res.json({ ok: true });});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on :${PORT}`));