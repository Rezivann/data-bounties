const express = require("express");
const router = express.Router();
const db = require("../database");

router.post("/", (req, res) => {
  try {
    const { prompt, category, payout_amount, total_slots } = req.body;

    if (!prompt || !category || !payout_amount || !total_slots) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = db.prepare(
      "INSERT INTO bounties (prompt, category, payout_amount, total_slots, slots_filled, status) VALUES (?, ?, ?, ?, 0, 'open')"
    ).run(prompt, category, payout_amount, total_slots);

    res.status(201).json({
      id: result.lastInsertRowid,
      prompt, category, payout_amount, total_slots,
      slots_filled: 0,
      status: 'open'
    });
  } catch (err) {
    console.error("Create bounty error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const bounties = db.prepare("SELECT * FROM bounties WHERE id = ?").get(id);
        if (!bounties) {
            return res.status(404).json({ error: "Bounty not found"});
        }
        res.json(bounties);
    } catch (err) {
        console.error("Get bounty error:", err.message);
        res.status(500).json({error: "Server error"});
    }
});

router.post("/create", async (req, res) => {
    try {
        const { prompt, category, payout_amount, total_slots } = req.body;
        const result = db.prepare(`INSERT INTO bounties (prompt, category, payout_amount, total_slots) VALUES (?, ?, ?, ?)`).run(prompt, category, payout_amount, total_slots);
        console.log(result.lastInsertRowid);
        res.json({id: result.lastInsertRowid, message: "Bounty created"});
    } catch (err) {
        console.error("Get bounty error:", err.message);
        res.status(500).json({error: "Server error"});
    }
});

module.exports = router;