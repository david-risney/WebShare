var PageScraper = (function () { 
    var uriNormalizer = function (documentUri, relativeUri) {
        return Windows.Foundation.Uri(documentUri, relativeUri).absoluteCanonicalUri;
    },
        htmlNormalizer = function (documentUri, htmlIn) {
            return htmlIn;
        },
        scrape = function (selector, property, normalizer, result) {
            return { selector: selector, property: property, normalizer: normalizer, result: result };
        },
        properties = ["pageName", "siteName", "siteImageUri", "siteBackgroundColor", "selectionImageUri", "selectionText"],
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
            var element = scrapeDoc.querySelector(scrapeEntry.selector),
                property;

            if (element) {
                property = element[scrapeEntry.property] || element.getAttribute(scrapeEntry.property);
                if (property !== undefined) {
                    if (scrapeEntry.normalizer) {
                        property = scrapeEntry.normalizer(uri, property);
                    }
                    if (property !== undefined) {
                        result[scrapeEntry.result].push(property);
                    }
                }
            }
        };

    return function () {
        var that = this;
        properties.forEach(function (property) {
            that[property] = [];
        });
        this.scrapeAsync = function (uri) {
            return WinJS.xhr({ responseType: "document", url: uri }).then(function (xhr) {
                var scrapeDoc = xhr.response;
                scrapeList.forEach(applyScrape.bind(null, that, scrapeDoc, uri));
                return that;
            });
        };
        this.pickBestImageAsync = function (uriList) {
            var uriResultList = [],
                signal = new SignalPromise(),
                count = 0,
                incrementAndCheckCompletionCount = function () {
                    if (++count === uriList.length) {
                        uriResultList.sort(function (left, right) {
                            if (left.success !== right.success) {
                                return left.success ? -1 : 1;
                            }
                            else if (left.success) {
                                return right.result - left.result;
                            }
                            else {
                                return 0;
                            }
                        });
                        signal.complete(uriResultList[0].uri);
                    }
                };
            
            uriList.map(function (uri) {
                var signal = new SignalPromise(),
                    img = document.createElement("img");
                img.onerror = function () { signal.error(); };
                img.onload = function () { signal.complete(img.width * img.height); };
                img.src = uri;

                return signal.promise;
            }).forEach(function (promise, idx) {
                promise.done(function (result) {
                    uriResultList[idx] = { uri: uriList[idx], success: true, result: result };
                    incrementAndCheckCompletionCount();
                }, function (error) {
                    uriResultList[idx] = { uri: uriList[idx], success: fail, result: error };
                    incrementAndCheckCompletionCount();
                });
            });

            return signal.promise;
        };
    };
}());