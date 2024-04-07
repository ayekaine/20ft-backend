const httpRequest = require('./helpers/httpRequest');

async function fetchCloudcastsByTag(tagName) {
    const url = `http://localhost:1337/api/cloudcasts?filters[tags][name][$eq]=${encodeURIComponent(tagName)}&populate=tags`;
    const method = 'GET';
    try {
        const data = await httpRequest(url, method);
        return data;
    } catch (error) {
        throw new Error(`Error fetching cloudcasts by tag: ${error.message}`);
    }
}

// Example usage:
fetchCloudcastsByTag('Trance')
    .then(data => console.log(data))
    .catch(error => console.error(error.message));
