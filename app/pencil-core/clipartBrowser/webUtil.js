var WebUtil = {
    get : function(url, headers, onComplete, onError, rq) {
        try {
            var req = new XMLHttpRequest();
            req.onreadystatechange = function(aEvt) {
                if (req.readyState == 4) {
                    //debug("url: " + url);
                    //debug(req.status);
                    if (req.status >= 200 && req.status < 300) {
                        if (onComplete) {
                            onComplete(req.responseText);
                        }
                    } else {
                        if (onError) {
                            onError({status: req.status, responseText: req.responseText || ""})
                        }
                    }
                }
            };
            req.open("GET", url, true);
            if (headers && headers.length) {
                for (var index in headers) {
                    var header = headers[index];
                    if (!header.name || !header.value) continue;
                    req.setRequestHeader(header.name, header.value);
                }
            }
            req.send(null);
            rq.push(req);
        } catch (e) {
            error(e);
        }
    },

    getMetadata : function(url, onComplete, rq) {
        try {
            var req = new XMLHttpRequest();
            req.onreadystatechange = function(aEvt) {
                if (req.readyState == 4) {
                    var size = req.getResponseHeader('Content-Length');
                    onComplete(size);
                }
            };

            req.open("HEAD", url, true);
            req.send(null);
            rq.push(req);
        } catch (e) {
            error("getMetaData: " + e);
        }
    }
};
