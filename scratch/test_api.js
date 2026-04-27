const axios = require("axios");

async function testApi() {
    try {
        console.log("Attempting to fetch logs from API...");
        // Since we can't easily get a token here, let's just check the endpoint existence
        // or bypass auth for a second to test the controller.
        const response = await axios.get("http://localhost:5000/api/logs");
        console.log(response.data);
    } catch (error) {
        console.log("Error status:", error.response?.status);
        console.log("Error data:", error.response?.data);
    }
}

testApi();
