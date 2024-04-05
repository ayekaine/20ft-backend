// TODO: adjust the script to fetch cloudcasts from the previous summer (or anytime needed)

require("dotenv").config(); // Load variables from .env file

const fetch = require("node-fetch");

const MIXCLOUD_API_URL = "https://api.mixcloud.com/20ftradio/cloudcasts/";
const STRAPI_API_URL = "http://localhost:1337/api/cloudcasts"; // Update this URL based on your Strapi instance
const API_TOKEN = process.env.API_TOKEN;

async function fetchCloudcasts() {
  try {
    const response = await fetch(MIXCLOUD_API_URL);
    const data = await response.json();
    const cloudcastsData = data?.data || [];
    return cloudcastsData;
  } catch (error) {
    console.error("Failed to fetch data from Mixcloud:", error.message);
    return [];
  }
}

async function saveCloudcastToStrapi(cloudcast) {
  const cloudcastData = {
    title: cloudcast.name,
    url: cloudcast.url,
    created_at: cloudcast.created_time,
    updated_at: cloudcast.updated_time,
    play_count: cloudcast.play_count,
    favorite_count: cloudcast.favorite_count,
    comment_count: cloudcast.comment_count,
    listener_count: cloudcast.listener_count,
    repost_count: cloudcast.repost_count,
    pictures: cloudcast.pictures,
    slug: cloudcast.slug,
    user: cloudcast.user,
    audio_length: cloudcast.audio_length,
  };

  try {
    // Check for existing cloudcast by slug
    const existingCloudcastResponse = await fetch(
      `${STRAPI_API_URL}?filters[slug][$eq]=${cloudcast.slug}`,
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
        },
      }
    );
    const existingCloudcasts = await existingCloudcastResponse.json();

    if (existingCloudcasts.data.length === 0) {
      // Cloudcast does not exist, save it
      const response = await fetch(STRAPI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({ data: cloudcastData }),
      });

      if (response.ok) {
        console.log(`Saved cloudcast: ${cloudcast.name}`);
      } else {
        console.error(`Failed to save cloudcast: ${cloudcast.name}`);
      }
    } else {
      console.log(`Cloudcast already exists: ${cloudcast.name}`);
    }
  } catch (error) {
    console.error(`Error saving cloudcast: ${cloudcast.name}`, error);
  }
}

async function main() {
  const cloudcasts = await fetchCloudcasts();
  for (const cloudcast of cloudcasts) {
    await saveCloudcastToStrapi(cloudcast);
  }
}

main().then(() => console.log("Finished processing cloudcasts."));
