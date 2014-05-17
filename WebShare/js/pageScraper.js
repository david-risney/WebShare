var PageScraper = (function () { 
    var uriNormalizer = function (documentUri, relativeUri) {
            return Windows.Foundation.Uri(documentUri, relativeUri).absoluteCanonicalUri;
        },
        htmlNormalizer = function (documentUri, htmlIn) {
            return htmlIn;
        },
        scrape = function(selector, property, normalizer, result) {
            return { selector: selector, property: property, normalizer: normalizer, result: result };
        },
        scrapeList = [
            scrape("html > head > title", "textContent", htmlNormalizer, "pageName"),
            scrape('html > head > meta[name="twitter:site"]', 'content', htmlNormalizer, 'siteName'),
            scrape('html > head > meta[name="twitter:title"]', 'content', htmlNormalizer, 'pageName'),
            scrape('html > head > meta[property="og:site_name"]', 'content', htmlNormalizer, 'siteName'),
            scrape('html > head > meta[property="og:title"]', 'content', htmlNormalizer, 'pageName'),
            scrape('html > head > meta[name="msapplication-TileImage"]', 'content', uriNormalizer, 'siteImageUri'),
            scrape('html > head > link[rel="apple-touch-icon"]', 'href', uriNormalizer, 'siteImageUri'),
            scrape('html > head > link[rel="shortcut icon"]', 'href', uriNormalizer, 'siteImageUri'),
            scrape('html > head > link[rel="icon"]', 'href', uriNormalizer, 'siteImageUri'),
            scrape('html > head > meta[name="msapplication-TileColor"]', 'content', undefined, 'siteBackgroundColor'), // #ffffff
            scrape('html > head > meta[property="og:image"]', 'content', uriNormalizer, 'selectionImageUri'),
            scrape('html > head > meta[name="twitter:image:src"]', 'content', uriNormalizer, 'selectionImageUri'),
            scrape('html > head > meta[name="twitter:description"]', 'content', htmlNormalizer, 'selectionText'),
            scrape('html > head > meta[property="og:description"]', 'content', htmlNormalizer, 'selectionText'),
            scrape('html > head > meta[name="description"]', 'content', htmlNormalizer, 'selectionText')
        ],
        applyScrape = function (result, scrapeDoc, uri, scrapeEntry) {
            var element,
                property;
            if (!result[scrapeEntry.result]) {
                element = scrapeDoc.querySelector(scrapeEntry.selector);
                if (element) {
                    property = element[scrapeEntry.property] || element.getAttribute(scrapeEntry.property);
                    if (property) {
                        result[scrapeEntry.result] = scrapeEntry.normalizer ? scrapeEntry.normalizer(uri, property) : property;
                    }
                }
            }
        };

    return function () {
        var that = this;
        this.scrapeAsync = function (uri) {
            return WinJS.xhr({ responseType: "document", url: uri }).then(function (xhr) {
                var scrapeDoc = xhr.response;
                scrapeList.forEach(applyScrape.bind(null, that, scrapeDoc, uri));
                return that;
            });
        };
    };
}());