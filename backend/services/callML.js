const fetch = require("node-fetch");
const FormData = require("form-data");

async function callMLService(imageBuffer, prompt) {
    try {
        const form = new FormData();
        form.append("image", imageBuffer, {filename: "image.jpg"});
        form.append("prompt", prompt);

        const response = await fetch("http://localhost:5000/verify", 
            {
                method: "POST",
                body: form,
                headers: form.getHeaders()
            }
        );
        if (!response.ok) {
            throw new Error(`ML service error: ${response.status}`);
        }

        const verdict = await response.json();
        return verdict;
    } catch (err) {
        console.error("ML service call failed:", err.message);
        throw err;
    }
    
}

module.exports = {callMLService};