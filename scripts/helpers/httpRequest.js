require("dotenv").config(); // Load variables from .env file
const fetch = require("node-fetch");
const API_TOKEN = process.env.API_TOKEN;

async function httpRequest(url, method, headers = {}, body = null) {
    try {
        const options = {
            method,
            headers: {
                ...headers,
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`HTTP request failed: ${error.message}`);
    }
}

module.exports = httpRequest;
