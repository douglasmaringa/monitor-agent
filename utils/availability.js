const axios = require("axios");

// Function to perform website availability test with retry
async function performWebsiteAvailabilityTest(url, retries = 1) {
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      const response = await axios.get(url);

      // Check the response status code
      if (response.status === 200) {
        return "Up"; // Website is up
      } else {
        return "Down"; // Website is down
      }
    } catch (error) {
      console.error("Error performing website availability test:", error);
      attempt++;
    }
  }
  
  return "Down"; // Website is down after retries
}

module.exports = {
  performWebsiteAvailabilityTest
};
