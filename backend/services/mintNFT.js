require("dotenv").config();
const {
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
  TransferTransaction,
  NftId,
  TokenId,
  AccountId
} = require("@hashgraph/sdk");
const { client, operatorId, operatorKey } = require("../hedera");

const TOKEN_ID = process.env.HEDERA_TOKEN_ID;

async function mintCertificateNFT(toAccountId, metadataPointer) {
    try {

        const mintTx = await new TokenMintTransaction()
            .setTokenId(TOKEN_ID)
            .addMetadata(Buffer.from(metadataPointer))
            .freezeWith(client)
            .sign(operatorKey);

        const mintResponse = await mintTx.execute(client);
        const mintReceipt = await mintResponse.getReceipt(client);
        const serialNumber = mintReceipt.serials[0].toString();


        const transferTX = await new TransferTransaction()
            .addNftTransfer(TOKEN_ID, serialNumber, operatorId, toAccountId)
            .freezeWith(client)
            .sign(operatorKey)

        const transferResponse = await transferTX.execute(client);
        await transferResponse.getReceipt(client);

        return { tokenId: TOKEN_ID, serialNumber};

        
    } catch (err) {
        console.error("NFT mint failed: ", err.message);
        throw err;
    }
}
module.exports = { mintCertificateNFT };