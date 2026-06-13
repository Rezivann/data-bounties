require("dotenv").config();
const { TransferTransaction, Hbar, Transfer } = require("@hashgraph/sdk");
const { client, operatorId, operatorKey } = require("../hedera");

async function sendPayout(toAccountID, amount) {
    try {
        const tx = await new TransferTransaction()
            .addHbarTransfer(operatorId, new Hbar(-amount))
            .addHbarTransfer(toAccountID, new Hbar(amount))
            .freezeWith(client)
            .sign(operatorKey);
    
        const response = await tx.execute(client);
        const receipt = await response.getReceipt(client);
        return receipt.status.toString();
    } catch (err) {
        console.err("Payout failed:", err.message);
        throw err;
    }
} 

module.exports = {sendPayout}