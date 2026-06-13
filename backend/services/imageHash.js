const crypto = require("crypto")
const sharp = require("sharp")

function cryptoHash(buffer) {
    return crypto
        .createHash("sha256")
        .update(buffer)
        .digest("hex")
}

async function perceptualHash(buffer) {
    const {data} = await sharp(buffer).resize({width: 8, height: 8}).greyscale().raw().toBuffer({ resolveWithObject: true});
    // get the average brightness
    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
    const hash = data.reduce((str, val) => str + (val >= avg ? "1" : "0"), "");
    return hash;
}

//Tune thresholds to filter out identical images but still keep images from different angles for now
function isTooSimilar(hash1, hash2, threshold = 5) {
    const differences = hash1.split("")
        .filter((bit, i) => bit !== hash2[i])
        .length;

    return differences <= threshold;
}

module.exports = { cryptoHash, perceptualHash, isTooSimilar};