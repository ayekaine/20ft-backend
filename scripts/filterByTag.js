// TODO: not sure if this script needed at all, but if so - perhaps move paging logic to the httpRequest script

const httpRequest = require("./helpers/httpRequest");

async function fetchCloudcastsByTag(tagName, offset = 0, limit = 20) {
  const url = `http://localhost:1337/api/cloudcasts?filters[tags][name][$eq]=${encodeURIComponent(
    tagName
  )}&populate=tags&pagination[page]=${
    offset / limit + 1
  }&pagination[pageSize]=${limit}`;
  const method = "GET";

  try {
    const data = await httpRequest(url, method);
    return data;
  } catch (error) {
    throw new Error(`Error fetching cloudcasts by tag: ${error.message}`);
  }
}

// Example Usage (Fetching all pages)
async function fetchAllCloudcastsByTag(tagName) {
  let offset = 0;
  const allCloudcasts = [];
  let hasMorePages = true; // Assume there are more pages initially

  while (hasMorePages) {
    const { data, meta } = await fetchCloudcastsByTag(tagName, offset, 20);
    allCloudcasts.push(...data);
    offset += 20;

    // Check if there are more pages
    hasMorePages = meta?.pagination?.total > offset;
  }

  return allCloudcasts;
}

fetchAllCloudcastsByTag("Techno")
  .then((allCloudcasts) =>
    console.log(allCloudcasts, `length: ${allCloudcasts.length}`)
  )
  .catch((error) => console.error(error.message));
