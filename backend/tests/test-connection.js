require("dotenv").config();
const { client } = require("../hedera");

console.log("Hedera client created successfully");
console.log("Network:", client._network);
console.log("Done — no errors means your key parsed correctly");

process.exit(0);