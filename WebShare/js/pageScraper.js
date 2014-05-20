var PageScraper = (function () { 
    var winrtUriToUri = function(uri) {
            var uriStr;
            try {
                uriStr = uri.absoluteCanonicalUri;
            }
            catch (e) {
                uriStr = uri.absoluteUri;
            }
            return uriStr;
        },
        uriNormalizer = function (documentUri, relativeUri) {
            var documentOrigin = winrtUriToUri(new Windows.Foundation.Uri(documentUri, "/"));
            relativeUri = relativeUri.replace(document.location.protocol +"//" + document.location.host + "/", documentOrigin);
            return winrtUriToUri(new Windows.Foundation.Uri(documentUri, relativeUri));
        },
        htmlNormalizer = function (documentUri, htmlIn) {
            return htmlIn;
        },
        scrape = function (selector, property, normalizer, result) {
            return { selector: selector, property: property, normalizer: normalizer, result: result };
        },
        properties = ["pageName", "siteName", "siteImageUri", "siteBackgroundColor", "selectionImageUri", "selectionText"],
        scrapeList = [
            scrape('html > head > meta[name="twitter:site"]', 'content', htmlNormalizer, 'siteName'),
            scrape('html > head > meta[name="twitter:title"]', 'content', htmlNormalizer, 'pageName'),
            scrape('html > head > meta[property="og:site_name"]', 'content', htmlNormalizer, 'siteName'),
            scrape('html > head > meta[property="og:title"]', 'content', htmlNormalizer, 'pageName'),
            scrape('html > head > meta[name="msapplication-TileImage"]', 'content', uriNormalizer, 'siteImageUri'),
            scrape('html > head > link[rel="apple-touch-icon"]', 'href', uriNormalizer, 'siteImageUri'),
            scrape('html > head > meta[name="msapplication-TileColor"]', 'content', undefined, 'siteBackgroundColor'), // #ffffff
            scrape('html > head > meta[property="og:image"]', 'content', uriNormalizer, 'selectionImageUri'),
            scrape('html > head > meta[name="twitter:image:src"]', 'content', uriNormalizer, 'selectionImageUri'),
            scrape('html > head > meta[name="twitter:description"]', 'content', htmlNormalizer, 'selectionText'),
            scrape('html > head > meta[property="og:description"]', 'content', htmlNormalizer, 'selectionText'),
        ],
        scrapeListSecondary = [
            scrape("html > head > title", "textContent", htmlNormalizer, "pageName"),
            scrape('html > head > link[rel="shortcut icon"]', 'href', uriNormalizer, 'siteImageUri'),
            scrape('html > head > link[rel="icon"]', 'href', uriNormalizer, 'siteImageUri'),
            scrape('img', 'src', uriNormalizer, 'selectionImageUri'),
            scrape('html > head > meta[name="description"]', 'content', htmlNormalizer, 'selectionText')
        ],
        initScrapeHolder = function (result, properties) {
            properties.forEach(function (property) {
                result[property] = [];
            });
        },
        arrayFrom = function (arrayLike) {
            var array = [],
                idx;
            for (idx = 0; idx < arrayLike.length; ++idx) {
                array[idx] = arrayLike[idx];
            }
            return array;
        },
        applyScrape = function (result, scrapeDoc, uri, scrapeEntry) {
            var elements = arrayFrom(scrapeDoc.querySelectorAll(scrapeEntry.selector));

            elements.forEach(function (element) {
                var property = element[scrapeEntry.property] || element.getAttribute(scrapeEntry.property);
                if (property !== undefined) {
                    if (scrapeEntry.normalizer) {
                        property = scrapeEntry.normalizer(uri, property);
                    }
                    if (property !== undefined) {
                        result[scrapeEntry.result].push(property);
                    }
                }
            });
        };

    return function () {
        var that = this;
        initScrapeHolder(that, properties);

        this.scrapeAsync = function (uri) {
            return WinJS.xhr({ responseType: "document", url: uri }).then(function (xhr) {
                var scrapeDoc = xhr.response,
                    contentType = xhr.getResponseHeader("content-type"),
                    contentTypeParts = contentType.split("/"),
                    contentTypeCategory = contentTypeParts.length && contentTypeParts[0].toLowerCase(),
                    secondaryData = {};
                if (scrapeDoc) {
                    scrapeList.forEach(applyScrape.bind(null, that, scrapeDoc, uri));
                    initScrapeHolder(secondaryData, properties);
                    scrapeListSecondary.forEach(applyScrape.bind(null, secondaryData, scrapeDoc, uri));
                    properties.forEach(function (property) {
                        if (that[property].length === 0) {
                            that[property] = secondaryData[property];
                        }
                    });
                }

                if (contentTypeCategory === "image") {
                    that.selectionImageUri.push(uri);
                }
                return that;
            });
        };
    };
}());