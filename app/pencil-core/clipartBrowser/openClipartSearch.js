function OpenClipartSearch() {

    this.title = "OpenClipart.org";
    this.name = "OpenClipart.org";
    this.uri = "https://openclipart.org/";
    this.icon = "https://openclipart.org/favicon.ico";
    this.baseUri = "https://openclipart.org/api/v2@beta/search";
    this.options = {
        page: 1
    };

    this.req = [];
}
OpenClipartSearch.prototype = new SearchEngine();

OpenClipartSearch.prototype.merge = function (o, n) {
    for (var i in n) {
        o[i] = n[i];
    };
    return o;
};

OpenClipartSearch.prototype.buildSearchUri = function (query, options) {
    var url = this.baseUri + "?q=" + query;

    var searchOptions = {
        offset: options.limit * (options.page - 1),
        per_page: options.limit
    };
    var param = "";
    for (var i in searchOptions) {
        param += "&" + i + "=" + searchOptions[i];
    };

    return url + param;
};

OpenClipartSearch.prototype.searchImpl = function(query, options, onComplete, onError) {
    this.options = this.merge(this.options, options);
    var url = this.buildSearchUri(query, this.options);

    for (var ii = 0; ii < this.req.length; ii++) {
        this.req[ii].abort();
        this.req[ii].onreadystatechange = null;
    }

    this.req = [];
    var thiz = this;

    console.log(`OpenClipart: searching ${query}`);
    var token = Config.get("openclipart.search.api_key_token", "");
    WebUtil.get(url, [{
                "name": "x-openclipart-apikey",
                "value" : token,
            }],
    function(response) {
        var r = thiz.parseSearchResult(response);
        if (onComplete) {
            onComplete(r.result, r.resultCount);
        }
    }, onError, this.req);
};

OpenClipartSearch.prototype.formatType = function(ty) {
    if (ty) {
        var idx = ty.indexOf("/");
        if (idx != -1) {
            return ty.substring(idx + 1).toUpperCase();
        }
    }
    return Util.getMessage("unknow.type");
};

OpenClipartSearch.prototype.parseSearchResult = function(response) {
    var result = {
        result: [],
        resultCount: 0
    };

    try {
        response = JSON.parse(response);
    } catch (ex) {}

    if (!response || response.status != 200 || !response.success || !response.data) {
        return result;
    }
    result.resultCount = response.data.total_results;
    result.pages = response.data.total_results / response.data.files_count;

    _.forEach(response.data.files, function(e) {
        var item = {
            id: e.id,
            name: e.title,
            description: e.description,
            src: e.svg_file,
            type: 'SVG',
            size: e.filesize,
            thumb: e.thumbnails["small"] || e.thumbnails["medium"] || e.thumbnails["large"] || "",
            pubDate: e.created_at,
            link: e.url
        };
        result.result.push(item);
    });

    return result;
};

//SearchManager.registerSearchEngine(OpenClipartSearch, false);
