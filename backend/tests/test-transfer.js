require("dotenv").config();
const { TransferTransaction, Hbar } = require("@hashgraph/sdk");
const { client, operatorId, operatorKey } = require("../hedera");

async function testTransfer() {
  // replace with your second testnet account ID
  const RECEIVER_ID = "0.0.9223215";

  console.log("Sending 1 HBAR from", operatorId.toString(), "to", RECEIVER_ID);

  const tx = await new TransferTransaction()
    .addHbarTransfer(operatorId, new Hbar(-1))   // subtract from sender
    .addHbarTransfer(RECEIVER_ID, new Hbar(1))   // add to receiver
    .freezeWith(client)
    .sign(operatorKey);

  const response = await tx.execute(client);
  const receipt = await response.getReceipt(client);

  console.log("Transfer status:", receipt.status.toString());
  console.log("Transaction ID:", response.transactionId.toString());
  console.log("✅ Transfer worked");
}

testTransfer()
  .catch(err => {
    console.error("❌ Transfer failed:", err.message);
    process.exit(1);
  })
  .finally(() => process.exit(0));