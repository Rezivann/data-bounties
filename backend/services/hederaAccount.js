const { AccountCreateTransaction, Hbar } = require("@hashgraph/sdk");
const { client, operatorKey } = require("../hedera");
const db = require("../database");

async function getOrCreateHederaAccount(privyWalletAddress) {
    try {
        const existingUser = db.prepare(`SELECT * FROM users WHERE wallet_address = ?`).get(privyWalletAddress);
        if (existingUser) {
            return existingUser.hedera_account_id;
        }
        const newAccount = await new AccountCreateTransaction().setKey(operatorKey.publicKey).setInitialBalance(new Hbar(0)).freezeWith(client).sign(operatorKey);
        const response = await newAccount.execute(client);
        const receipt = await response.getReceipt(client);
        const accountId = receipt.accountId.toString();
        const result = db.prepare(`INSERT INTO users (wallet_address, hedera_account_id, created_at) VALUES(?, ?, ?)`).run(privyWalletAddress, accountId, Date.now());
        return accountId;
    }
    catch (err) {
        console.error("Hedera account creation failed:", err.message);
        throw err;
    }
}

module.exports = { getOrCreateHederaAccount };