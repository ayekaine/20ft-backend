require("dotenv").config(); // Load variables from .env file
const fetch = require("node-fetch");
const API_TOKEN = process.env.API_TOKEN;


async function fetchCloudcastsByTag(tagName) {
    const response = await fetch(`http://localhost:1337/api/cloudcasts?filters[tags][name][$eq]=${encodeURIComponent(tagName)}&populate=tags`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  }
  
  // Example usage:
  fetchCloudcastsByTag('Trance')
    .then(data => console.log(data))
    .catch(error => console.error('Error fetching cloudcasts by tag:', error));
  