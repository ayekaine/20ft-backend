// TODO: add retries in case of ETIMEDOUT

const httpRequest = require("./helpers/httpRequest");

const MIXCLOUD_API_URL = "https://api.mixcloud.com/20ftradio/cloudcasts/";
const STRAPI_API_URL = "http://localhost:1337/api/cloudcasts"; // Update this URL based on your Strapi instance

async function fetchCloudcasts(
  startDate,
  endDate,
  nextUrl = null,
  retries = 0
) {
  let url = nextUrl || MIXCLOUD_API_URL + "?limit=20"; // Set a default limit

  if (startDate && !nextUrl) {
    // Only add paging/filtering on the initial fetch
    // Use the offset=0 parameter if nextUrl is not provided, to ensure consistent paging behavior
    url += "&offset=0";
  }

  if (startDate) {
    url += `&since=${startDate.toISOString()}`;
  }
  if (endDate) {
    url += `&until=${endDate.toISOString()}`;
  }

  try {
    const data = await httpRequest(url, "GET");
    const cloudcastsData = data?.data || [];

    return {
      cloudcasts: cloudcastsData,
      nextUrl: data?.paging?.next || null,
    };
  } catch (error) {
    if (retries < 3 && error.message.includes("ETIMEDOUT")) {
      // Adjust max retries as needed
      console.error(
        `Fetch attempt ${retries + 1} failed: ${error.message}. Retrying...`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      return fetchCloudcasts(startDate, endDate, nextUrl, retries + 1);
    } else {
      console.error("Failed to fetch data after retries:", error.message);
      return { cloudcasts: [], nextUrl: null };
    }
  }
}

async function saveCloudcastToStrapi(cloudcast) {
  console.log(cloudcast);

  const tagIds = await Promise.all(
    cloudcast.tags.map(async (tag) => {
      try {
        const tagResponse = await httpRequest(
          `http://localhost:1337/api/tags?filters[name][$eq]=${encodeURIComponent(
            tag.name
          )}`,
          "GET"
        );
        const tagData = tagResponse.data;

        if (tagData.length === 0) {
          const createTagResponse = await httpRequest(
            `http://localhost:1337/api/tags`,
            "POST",
            {
              "Content-Type": "application/json",
            },
            {
              data: {
                name: tag.name,
                key: tag.key,
                url: tag.url,
              },
            }
          );
          return createTagResponse.data.id;
        } else {
          return tagData[0].id;
        }
      } catch (error) {
        console.error("Error processing tag:", error.message);
        return null;
      }
    })
  );

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
    pictures: { ...cloudcast.pictures },
    slug: cloudcast.slug,
    user: { ...cloudcast.user },
    audio_length: cloudcast.audio_length,
  };

  const cloudcastDataWithTags = {
    ...cloudcastData,
    tags: tagIds.map((tagId) => ({ id: tagId })),
  };

  try {
    const existingCloudcastResponse = await httpRequest(
      `${STRAPI_API_URL}?filters[slug][$eq]=${cloudcast.slug}`,
      "GET"
    );
    const existingCloudcasts = existingCloudcastResponse.data;

    if (existingCloudcasts.length === 0) {
      const response = await httpRequest(
        STRAPI_API_URL,
        "POST",
        {
          "Content-Type": "application/json",
        },
        {
          data: cloudcastDataWithTags,
        }
      );

      if (response) {
        console.log(`Saved cloudcast: ${cloudcast.name}`);
      } else {
        console.error(`Failed to save cloudcast: ${cloudcast.name}`);
      }
    } else {
      console.log(`Cloudcast already exists: ${cloudcast.name}`);
    }
  } catch (error) {
    console.error(`Error saving cloudcast: ${cloudcast.name}`, error.message);
  }
}

async function main() {
  // Example: Fetch cloudcasts from last summer
  const startDate = new Date(2023, 5, 21);
  const endDate = new Date(2023, 8, 22);

  let nextUrl = null;
  do {
    const { cloudcasts, nextUrl: nextPageUrl } = await fetchCloudcasts(
      startDate,
      endDate,
      nextUrl
    );

    for (const cloudcast of cloudcasts) {
      await saveCloudcastToStrapi(cloudcast);
    }

    nextUrl = nextPageUrl;
  } while (nextUrl);

  console.log("Finished processing cloudcasts.");
}

main();
