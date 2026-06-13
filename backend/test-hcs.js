require("dotenv").config();
const {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction
} = require("@hashgraph/sdk");
const { client, operatorKey } = require("./hedera");

async function testHCS() {
  // step 1: create a topic
  console.log("Creating HCS topic...");
  const topicTx = await new TopicCreateTransaction()
    .freezeWith(client)
    .sign(operatorKey);

  const topicResponse = await topicTx.execute(client);
  const topicReceipt = await topicResponse.getReceipt(client);
  const topicId = topicReceipt.topicId.toString();

  console.log("Topic created:", topicId);
  console.log("⚠️  Copy this into your .env as HEDERA_TOPIC_ID");

  // step 2: submit a test message to it
  const testMessage = JSON.stringify({
    bountyId: 1,
    walletAddress: "0.0.test",
    result: "passed",
    caption: "a red stop sign",
    timestamp: Date.now()
  });

  console.log("Submitting message to topic...");
  const msgTx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(testMessage)
    .execute(client);

  const msgReceipt = await msgTx.getReceipt(client);
  console.log("Message status:", msgReceipt.status.toString());
  console.log("✅ HCS log worked");
}

testHCS()
  .catch(err => {
    console.error("❌ HCS failed:", err.message);
    process.exit(1);
  })
  .finally(() => process.exit(0));