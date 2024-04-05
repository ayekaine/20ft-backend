require("dotenv").config();
const fetch = require("node-fetch");
const API_TOKEN = process.env.API_TOKEN;

async function httpRequest(
  url,
  method,
  headers = {},
  body = null,
  retries = 0,
  maxRetries = 3,
  retryDelay = 1000
) {
  try {
    const options = {
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    if (retries < maxRetries && error.message.includes("ETIMEDOUT")) {
      console.error(
        `Request failed (${retries + 1}): ${error.message}. Retrying in ${
          retryDelay / 1000
        } seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return httpRequest(
        url,
        method,
        headers,
        body,
        retries + 1,
        maxRetries,
        retryDelay
      );
    } else {
      throw new Error(`HTTP request failed after retries: ${error.message}`); // Ensure errors propagate
    }
  }
}

module.exports = httpRequest;
