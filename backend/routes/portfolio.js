const express = require("express");
const router = express.Router();
const db = require("../database");



router.get("/:walletAddress", async (req, res) => {
    try {
        const user = db.prepare("SELECT hedera_account_id FROM users WHERE wallet_address = ?").get(req.params.walletAddress);
        if (!user) {
            return res.json([]);
        }

        const TOKEN_ID = process.env.HEDERA_TOKEN_ID;
        const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${user.hedera_account_id}/nfts?token.id=${TOKEN_ID}`;
        const response = await fetch(url)

        const data = await response.json();
        const tokens = (data.nfts || []).map(nft => {
            const pointer = Buffer.from(nft.metadata, "base64").toString("utf8");
            const details = db.prepare(`
                SELECT s.caption, s.image_hash, b.category
                FROM submissions s
                JOIN bounties b ON s.bounty_id = b.id
                WHERE s.metadata_pointer = ?`).get(pointer);
            return {
                tokenId: nft.token_id,
                serialNumber: nft.serial_number,
                metadataPointer: pointer,
                category: details?.category,
                caption: details?.caption,
                imagePath: details?.image_hash ? `/uploads/${details.image_hash}.jpg` : undefined
            };
        });
        res.json(tokens);
        
    } catch (err) {
        console.error("Getting verified NFTs error:", err.message);
        res.status(500).json({error: "Server error"});
    }
});


router.get("/:walletAddress/balance", async (req, res) => {
    try {
        const user = db.prepare("SELECT hedera_account_id FROM users WHERE wallet_address = ?").get(req.params.walletAddress)

        if (!user) {
            return res.json({balance : 0})
        }

        const url = `https://testnet.mirrornode.hedera.com/api/v1/balances?account.id=${user.hedera_account_id}`
        const response = await fetch(url)
        const data = await response.json();

        const tinybars = data.balances[0]?.balance || 0;
        const hbar = tinybars /100_000_000;

        res.json({balance : hbar});
    } catch (err) {
        console.error("Balance fetch error");
        res.status(500).json({error: "Server error"});
    }
    

});


module.exports = router;