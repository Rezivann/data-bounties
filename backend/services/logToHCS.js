require("dotenv").config();
const {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction
} = require("@hashgraph/sdk");
const { client, operatorKey } = require("../hedera");
const TOPIC_ID = process.env.HEDERA_TOPIC_ID;

async function logToHCS(verdictData) {
    try {
        const outputMessage = JSON.stringify({
            bountyId:        verdictData.bountyId,
            walletAddress:   verdictData.walletAddress,
            tokenId:         verdictData.tokenId,
            serialNumber:    verdictData.serialNumber,
            category:        verdictData.category,
            caption:         verdictData.caption,
            confidenceScore: verdictData.confidenceScore,
            result:          verdictData.result,
            timestamp:       verdictData.timestamp
        });
        

        const msgTx = await new TopicMessageSubmitTransaction()
            .setTopicId(TOPIC_ID)
            .setMessage(outputMessage)
            .execute(client);

        const msgReceipt = await msgTx.getReceipt(client);
        return msgReceipt.status.toString();
    } catch (err) {
        console.error("HCS Log Failed:", err.message);
        throw err;
    }
    

}

module.exports = {logToHCS};