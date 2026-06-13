require("dotenv").config();
const { Client, PrivateKey, AccountId } = require("@hashgraph/sdk");

const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
const operatorKey = PrivateKey.fromStringDer(process.env.HEDERA_PRIVATE_KEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

module.exports = { client, operatorId, operatorKey };