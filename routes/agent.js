const express = require("express");
const router = express.Router();
const { performWebsiteAvailabilityTest } = require("../utils/availability");
const ping = require("ping");
const net = require("net");

const Token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
// POST /monitor/:url
router.post("/", async (req, res) => {
  try {
    const url = req.body.url;
    const port = req.body.port || 443;
    const token = req.body.token;

    // Check if the password is correct
    if (token !== Token) {
        return res.status(401).json({ error: "Invalid token" });
      }
    // Remove the 'https://' prefix from the URL
    const pingUrl = url.slice(8);

    // Perform the website availability test
    const testResult = await performWebsiteAvailabilityTest(url);

    // Perform the ping test
    const pingResult = await performPingTest(pingUrl);

    // Perform the port check
    const portResult = await performPortCheck(pingUrl, port);

    // Return the test result as the response
    res.status(200).json({ availability: testResult, ping: pingResult, port: portResult });
  } catch (error) {
    console.error("Error performing test:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

async function performPingTest(destination, retries = 3, delay = 1000) {
  let attempts = 0;
  let isCancelled = false;

  return new Promise((resolve) => {
    const startPing = () => {
      ping.promise.probe(destination)
        .then((response) => {
          if (!isCancelled && response.alive) {
            resolve("Reachable"); // Target is reachable
          } else {
            attempts++;
            if (attempts < retries && !isCancelled) {
              setTimeout(startPing, delay); // Retry after delay
            } else {
              resolve("Unreachable"); // Target is unreachable after retries
            }
          }
        })
        .catch((error) => {
          console.error("Error performing ping test:", error);
          resolve("Unreachable"); // Error occurred during the ping test
        });
    };

    startPing();

    // Cancel ongoing ping on retries
    const cancelPing = () => {
      isCancelled = true; // Set cancellation flag
      resolve("Unreachable"); // Target is unreachable after cancellation
    };

    setTimeout(cancelPing, delay * retries);
  });
}

async function performPortCheck(url, port, timeout = 3000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      socket.destroy();
      resolve("Open"); // Port is open
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve("Closed"); // Port is closed (timeout)
    });

    socket.on("error", (error) => {
      socket.destroy();
      console.error("Error performing port check:", error);
      resolve("Closed"); // Port is closed (error)
    });

    socket.connect(port, url);
  });
}

module.exports = router;
