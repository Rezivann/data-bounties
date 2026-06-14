const { mintCertificateNFT } = require('./mintNFT');
const { logToHCS } = require('./logToHCS');
const { sendPayout } = require('./sendPayout')

const db = require("../database")

async function processVerdict(bountyId, wallet_address, hederaAccountID, caption, image_hash, perceptual_hash, category, confidence_score) {
    try {
        const bounty = db.prepare(`SELECT * FROM bounties WHERE id = ?`).get(bountyId);
        if (!bounty) {
            throw new Error(`Bounty ${bountyId} not found`);
        }

        const metadataPointer = `dbc:${bountyId}:${Date.now()}`;
        const {tokenId, serialNumber} = await mintCertificateNFT(
            hederaAccountID, metadataPointer
        );

        await logToHCS({
            bountyId,
            wallet_address,
            hederaAccountID,
            tokenId, 
            serialNumber,
            category,
            caption, 
            confidence_score,
            result: 'passed',
            timestamp: Date.now()
        })

        await sendPayout(hederaAccountID, bounty.payout_amount)

        db.prepare(`
            UPDATE bounties SET slots_filled = slots_filled + 1 WHERE id = ?
        `).run(bountyId);

        db.prepare(`
            UPDATE bounties SET status = 'closed' WHERE id = ? AND slots_filled >= total_slots
        `).run(bountyId)

        db.prepare(`
            INSERT INTO submissions (
                bounty_id, wallet_address, token_id, serial_number,
                image_hash, perceptual_hash, caption, confidence_score, 
                metadata_pointer, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            bountyId,
            wallet_address,
            tokenId,
            serialNumber,
            image_hash,
            perceptual_hash,
            caption,
            confidence_score,
            metadataPointer,
            Date.now()  
        );

        return {tokenId, serialNumber};
    } catch (err) {
        console.error("Processing verdict failed: ", err.message);
        throw err;
    }
}

module.exports = { processVerdict }