const express = require("express");
const router = express.Router();
const multer = require("multer");
const db = require("../database");
const { callMLService } = require("../services/callML");
const { processVerdict } = require("../services/processVerdict");
const { cryptoHash, perceptualHash, isTooSimilar } = require("../services/imageHash");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 5 * 1024 * 1024},
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Images only"));
    }
    
});

router.post("/submit", upload.single("image"), async (req, res) => {
    try {
        const {bountyId, wallet_address} = req.body;
        const imageBuffer = req.file.buffer;
        const bounty = db.prepare("SELECT * FROM bounties WHERE id = ?").get(bountyId);
        if (!bounty) {
            return res.status(404).json({ error: "Bounty not found" });
        }
        if (bounty.status !== "open") {
            return res.status(400).json({ error: "Bounty is closed" });
        }
        
        const currentPerceptualHash = await perceptualHash(imageBuffer)
        const imageHash = cryptoHash(imageBuffer)
        const existingSubmissoins = db.prepare("SELECT perceptual_hash FROM submissions WHERE bounty_id = ?").all(bountyId);
        const isDuplicate = existingSubmissoins.some(row =>
            isTooSimilar(row.perceptual_hash, currentPerceptualHash));
        if (isDuplicate) {
            return res.status(400).json({ error: "This image has already been submitted"});
        }
        const verdict = await callMLService(imageBuffer, bounty.prompt);
        if (verdict.passed) {
            const { tokenId, serialNumber} = await processVerdict(bountyId, wallet_address, verdict.caption, imageHash, currentPerceptualHash, bounty.category, verdict.match_score); 
            return res.json({
                success: true,
                caption: verdict.caption,
                tokenId,
                serialNumber
            });
        }
        else {
            return res.status(400).json({
                error: "Image did not pass verification",
                reason: !verdict.authentic ? "Appears AI generated" : "Does not match with bounty prompt"
            });
        }
        



    }
    catch (err) {
        console.error("Submit error:", err.message);
        res.status(500).json({error: "Server error"});
    }
})
module.exports = router;