// youtube is a bit consistent, usually a page will have 20 results but sometimes only 7 or so will be returned
// and sometimes you get an empty result on the first try but it has 20 the next time.
// Also, view counts don't match the web interface exactly.
// And - it seems we get locked out after firing ~100 requests :(
// TODO look into API https://developers.google.com/youtube/v3/docs/search/list

const request = require('request-promise-native');
const util = require('util');

// get the nth page of results for given query, each page seems to have 20 results
search = async (query, page) => {
    // security hole? should clean arguments
    var url=`https://www.youtube.com/results?search_query=${query}&sp=CAMSAhAB&page=${page}&pbj=1`
    // pbj=1 seems to request json response,
    // sp=CAMSAhAB means only search videos and order by descending view count (there's no option for ascending)
    console.log("requesting "+url)
    return request.get({
        url: url,
        headers: {
            'x-youtube-client-version': '2.20181110',
            'x-youtube-client-name': 1
        }
    }).then((body) => {
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
                url: `https://www.youtube.com/watch?v=${x.videoId}`,
                title: x.title.simpleText,
                page: page,
                views: parseInt(x.viewCountText.simpleText.replace(/\D/g, '')) || 0,
                viewText: x.viewCountText.simpleText
            }
        });
        console.log(`(${query}, ${page})->${videos.length}`)
        return videos;
    });
}

// return last 2 pages of least viewed videos (20-40 results)
leastViewed = async (query) => {
    // currently does at most 2 repeated requests, could be cleaned up

    // find last non-empty page with index in 0,1,3,7,15,...
    let i = 0;
    while ((await search(query, i)).length > 0) {
        i = (i+1)*2-1;
    }
    
    // now do binary search on remaining range to find last non-empty page
    a = (i+1)/2-1;
    b = i;
    mid = (a+b)/2 | 0;
    while (a != mid) {
        let l = (await search(query, mid)).length
        if (l > 0) {
            a = mid;
        } else {
            b = mid;
        }
        mid = (a+b)/2 | 0;
    }

    return (await search(query, mid-1)).concat(await search(query, mid));
}

main = async () => {
    let result = await leastViewed("nudibranch");
    console.log(result);
}

main();
