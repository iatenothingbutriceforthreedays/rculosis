const request = require('request-promise-native');
const util = require('util');

search = async (query, apiKey, pageToken) => {
    // security hole? should clean arguments
    var url=`https://www.googleapis.com/youtube/v3/search?type=video&maxResults=50&q=${query}&order=viewCount&part=snippet&key=${apiKey}`
    if (pageToken) url+=`&pageToken=${pageToken}`

    console.log("requesting "+url)
    return request.get(url).then((body) => {
        data = JSON.parse(body);
        // extract list of videos from messy response
        videos = data.items.map((item) => {
            return {
                videoId: item.id.videoId,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                title: item.snippet.title,
                // API doesn't give view count :(
            }
        });
        return {videos: videos, nextPageToken: data.nextPageToken};
    });
}

// return last page of least viewed videos (1-50 results)
leastViewed = async (query, apiKey) => {
    // keep stepping until empty result
    let result = await search("nudibranch", API_KEY);
    let i = 1;
    let prevVideos;
    while (result.videos.length > 0) {
        prevVideos = result.videos;
        result = await search("nudibranch", API_KEY, result.nextPageToken);
        console.log(`(${query}, ${i})->${result.videos.length}`);
    }
    return prevVideos;
}

main = async () => {
    let result = await leastViewed("nudibranch", API_KEY);
    console.log(result);
}

