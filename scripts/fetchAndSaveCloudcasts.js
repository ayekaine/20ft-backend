// TODO: adjust the script to fetch cloudcasts from the previous summer (or anytime needed)

const httpRequest = require('./helpers/httpRequest');

const MIXCLOUD_API_URL = "https://api.mixcloud.com/20ftradio/cloudcasts/";
const STRAPI_API_URL = "http://localhost:1337/api/cloudcasts"; // Update this URL based on your Strapi instance

async function fetchCloudcasts() {
    try {
        const data = await httpRequest(MIXCLOUD_API_URL, 'GET');
        const cloudcastsData = data?.data || [];
        return cloudcastsData;
    } catch (error) {
        console.error("Failed to fetch data from Mixcloud:", error.message);
        return [];
    }
}

async function saveCloudcastToStrapi(cloudcast) {
    console.log(cloudcast);

    const tagIds = await Promise.all(cloudcast.tags.map(async (tag) => {
        try {
            const tagResponse = await httpRequest(`http://localhost:1337/api/tags?filters[name][$eq]=${encodeURIComponent(tag.name)}`, 'GET');
            const tagData = tagResponse.data;

            if (tagData.length === 0) {
                const createTagResponse = await httpRequest(`http://localhost:1337/api/tags`, 'POST', {
                    'Content-Type': 'application/json',
                }, {
                    data: {
                        name: tag.name,
                        key: tag.key,
                        url: tag.url,
                    },
                });
                return createTagResponse.data.id;
            } else {
                return tagData[0].id;
            }
        } catch (error) {
            console.error("Error processing tag:", error.message);
            return null;
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

    const cloudcastDataWithTags = {
        ...cloudcastData,
        tags: tagIds.map(tagId => ({ id: tagId })),
    };

    try {
        const existingCloudcastResponse = await httpRequest(`${STRAPI_API_URL}?filters[slug][$eq]=${cloudcast.slug}`, 'GET');
        const existingCloudcasts = existingCloudcastResponse.data;

        if (existingCloudcasts.length === 0) {
            const response = await httpRequest(STRAPI_API_URL, 'POST', {
                'Content-Type': 'application/json',
            }, {
                data: cloudcastDataWithTags,
            });

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
    const cloudcasts = await fetchCloudcasts();
    for (const cloudcast of cloudcasts) {
        await saveCloudcastToStrapi(cloudcast);
    }
}

main().then(() => console.log("Finished processing cloudcasts."));
