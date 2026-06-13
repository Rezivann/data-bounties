require("dotenv").config();
const {
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
  TransferTransaction,
  NftId,
  TokenId
} = require("@hashgraph/sdk");
const { client, operatorId, operatorKey } = require("./hedera");

async function testNFT() {

  // step 1: create the NFT collection
  console.log("Creating NFT collection...");
  const createTx = await new TokenCreateTransaction()
    .setTokenName("Data Bounty Certificate")
    .setTokenSymbol("DBC")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(operatorId)
    .setSupplyKey(operatorKey)
    .freezeWith(client)
    .sign(operatorKey);

  const createResponse = await createTx.execute(client);
  const createReceipt = await createResponse.getReceipt(client);
  const tokenId = createReceipt.tokenId.toString();

  console.log("NFT Collection created:", tokenId);
  console.log("⚠️  Copy this into your .env as HEDERA_TOKEN_ID");

  const metadataPointer = `db:${Date.now()}`;
  // step 2: mint one NFT with test metadata
//   const testMetadata = JSON.stringify({
//     imageHash: "abc123fakehash",
//     category: "stop sign",
//     confidenceScore: 0.94,
//     caption: "a red octagonal stop sign",
//     bountyId: 1,
//     timestamp: Date.now()
//   });

  console.log("Minting NFT...");
  const mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .addMetadata(Buffer.from(metadataPointer))
    .freezeWith(client)
    .sign(operatorKey);

  const mintResponse = await mintTx.execute(client);
  const mintReceipt = await mintResponse.getReceipt(client);
  const serialNumber = mintReceipt.serials[0].toString();

  console.log("NFT minted, serial number:", serialNumber);
  console.log("✅ NFT mint worked");
  console.log(`View on Hashscan: https://hashscan.io/testnet/token/${tokenId}/${serialNumber}`);
}

testNFT()
  .catch(err => {
    console.error("❌ NFT mint failed:", err.message);
    process.exit(1);
  })
  .finally(() => process.exit(0));