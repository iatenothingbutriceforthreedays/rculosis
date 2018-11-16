var request = require('request');

// get the nth page of results for given query, each page seems to have 20 results
search = (query, page, cb) => {
    // security hole? should clean arguments
    var url=`https://www.youtube.com/results?search_query=${query}&sp=CAMSAhAB&page=${page}&pbj=1`
    // pbj=1 seems to request json response,
    // sp=CAMSAhAB means only search videos and order by descending view count (there's no option for ascending)
    
    return request.get({
            url: url,
            headers: {
                'x-youtube-client-version': '2.20181110',
                'x-youtube-client-name': 1
            }
        },
        (error, response, body) => {
            data = JSON.parse(body);
            // extract list of videos from messy response
            renderers =  data[1].response.contents.twoColumnSearchResultsRenderer.primaryContents
                        .sectionListRenderer.contents[0].itemSectionRenderer.contents.map((x) => x.videoRenderer);
            
            renderers = renderers.filter((r) => r !== undefined);

            // renderers should be of shape [{videoId: xx, title:{...}, ...}, ...]
            // extract information we want:
            videos = renderers.map((x) => {
                return {
                    videoId: x.videoId,
                    title: x.title.simpleText,
                    views: parseInt(x.viewCountText.simpleText.replace(/,|\.| views| Aufrufe/ig, '')),
                }
            });
            cb(videos);
        }
    );
}

p = (videos) => {console.log(videos.length)};
search("xkj", 2, p);