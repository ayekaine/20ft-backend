// TODO: adjust the script to fetch cloudcasts from the previous summer (or anytime needed)
// TODO: populate tags into cloudcasts related table

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
  console.log(cloudcast);
 // First, process tags
 const tagIds = await Promise.all(cloudcast.tags.map(async (tag) => {
  // Check if the tag exists
  const tagResponse = await fetch(`http://localhost:1337/api/tags?filters[name][$eq]=${encodeURIComponent(tag.name)}`, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
  });
  const tagData = await tagResponse.json();

  // If the tag doesn't exist, create it
  if (tagData.data.length === 0) {
    const createTagResponse = await fetch(`http://localhost:1337/api/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          name: tag.name,
          key: tag.key,
          url: tag.url,
        },
      }),
    });
    const createdTag = await createTagResponse.json();
    return createdTag.data.id;
  } else {
    // If it exists, return the existing ID
    return tagData.data[0].id;
  }
}));

  const cloudcastData = {
    key: cloudcast.key,
    name: cloudcast.name,
    url: cloudcast.url,
    created_time: cloudcast.created_time,
    updated_time: cloudcast.updated_time,
    play_count: cloudcast.play_count,
    favorite_count: cloudcast.favorite_count,
    comment_count: cloudcast.comment_count,
    listener_count: cloudcast.listener_count,
    repost_count: cloudcast.repost_count,
    pictures: {...cloudcast.pictures},
    slug: cloudcast.slug,
    user: {...cloudcast.user},
    audio_length: cloudcast.audio_length,
  };

    // Cloudcast data adjusted to include tag relationships
    const cloudcastDataWithTags = {
      ...cloudcastData,
      // Add the relationships section
      tags: tagIds.map(tagId => ({ id: tagId })),
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
        body: JSON.stringify({ data: cloudcastDataWithTags }),
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
