const express = require("express");
const router = express.Router();


router.get("/:walletAddress", async (req, res) => {
    try {
        const TOKEN_ID = process.env.HEDERA_TOKEN_ID;
        const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${req.params.walletAddress}/nfts?token.id=${TOKEN_ID}`;
        const response = await fetch(url)
        const data = await response.json();
        const tokens = (data.nfts || []).map(nft => {
            const pointer = Buffer.from(nft.metadata, "base64").toString("utf8");
            return {
                tokenId: nft.token_id,
                serialNumber: nft.serial_number,
                metadataPointer: pointer
            };
        });
        res.json(tokens);
    } catch (err) {
        console.error("Getting verified NFTs error:", err.message);
        res.status(500).json({error: "Server error"});
    }
});

module.exports = router;