var ShareState = function () {
    var that = this,
        shareOperation,
        textToHtml = function (text) {
            return text.replace(/</g, "&lt;");
        };

    this.initializeAsync = function (shareOperationIn) {
        var result = WinJS.Promise.wrap(),
            pageScraper;

        shareOperation = shareOperationIn;

        if (shareOperation) {
            if (shareOperation.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.text)) {
                console.log("has text");
                result = result.then(function () {
                    return shareOperation.data.getTextAsync();
                }).then(function (text) {
                    console.log("got text");
                    that.selectionText = text;
                });
            }

            if (shareOperation.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.webLink)) {
                console.log("has weblink");
                result = result.then(function () {
                    return shareOperation.data.getWebLinkAsync();
                }).then(function (webLink) {
                    console.log("got weblink");
                    try {
                        that.uri = webLink.absoluteCanonicalUri;
                    }
                    catch (e) {
                        that.uri = webLink.absoluteUri;
                        console.log("Error reading absoluteCanonicalUri of " + webLink.rawUri);
                    }

                    pageScraper = new PageScraper();
                    return pageScraper.scrapeAsync(that.uri);
                }).then(function (result) {
                    console.log("scraped page");
                    return WinJS.Promise.wrap(result);
                });
            }

            if (shareOperation.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.html)) {
                console.log("has html");
                result = result.then(function () {
                    return shareOperation.data.getHtmlFormatAsync();
                }).then(function (htmlFormat) {
                    console.log("got html");
                    // Extract the HTML fragment from the HTML format 
                    that.selectionHtml = Windows.ApplicationModel.DataTransfer.HtmlFormatHelper.getStaticFragment(htmlFormat);
                });
            }
        }
        else {
            that.uri = "http://example.com/";
            that.uriText = "Example web page";
            that.selectionText = "This is an example of a page for sharing. Use Cloud Share through the Share Charm to share your own content.";
        }

        return result.then(function () {
            if (pageScraper) {
                if (!that.selectionHtml && !that.selectionText && (pageScraper.selectionText[0] || pageScraper.selectionImageUri[0])) {
                    if (pageScraper.selectionText[0]) {
                        that.selectionText = pageScraper.selectionText[0];
                        that.selectionHtml = textToHtml(pageScraper.selectionText[0]);
                        if (pageScraper.selectionImageUri[0]) {
                            that.selectionText += " ";
                        }
                    }
                    if (pageScraper.selectionImageUri[0]) {
                        that.selectionText += pageScraper.selectionImageUri[0];
                        that.selectionHtml += "<img src=\"" + pageScraper.selectionImageUri[0] +"\">";
                    }
                }

                if (!that.uriText && (pageScraper.siteName[0] || pageScraper.pageName[0])) {
                    that.uriText = "";
                    if (pageScraper.siteName[0]) {
                        that.uriText += pageScraper.siteName[0];
                        if (pageScraper.pageName[0]) {
                            that.uriText += " - ";
                        }
                    }
                    if (pageScraper.pageName[0]) {
                        that.uriText += pageScraper.pageName[0];
                    }
                }
            }
        });
    };

    this.completeSharingAsync = function (activity) {
        var quickLink,
            dataFormats = Windows.ApplicationModel.DataTransfer.StandardDataFormats,
            promise = WinJS.Promise.wrap();
        
        if (shareOperation) {
            quickLink = new Windows.ApplicationModel.DataTransfer.ShareTarget.QuickLink();
            quickLink.id = activity.uriTemplate;
            quickLink.title = activity.name + " - " + activity.description;

            // For quicklinks, the supported FileTypes and DataFormats are set independently from the manifest.
            quickLink.supportedFileTypes.replaceAll(["*"]);
            quickLink.supportedDataFormats.replaceAll([dataFormats.text, dataFormats.webLink, dataFormats.html]);

            promise = ImageUtils.drawImageWithBackgroundColorAsync(activity.imageUri, activity.backgroundColor).then(function (blob) {
                quickLink.thumbnail = Windows.Storage.Streams.RandomAccessStreamReference.createFromStream(blob.msDetachStream());

                shareOperation.reportStarted();
                shareOperation.reportCompleted(quickLink);
            }, function () {
                console.error("Failure getting activity image for quicklink.");

                return Windows.ApplicationModel.Package.current.installedLocation.createFileAsync("images\\smalllogo.scale-180.png", Windows.Storage.CreationCollisionOption.openIfExists).then(function (file) {
                    quickLink.thumbnail = Windows.Storage.Streams.RandomAccessStreamReference.createFromFile(file);
                    shareOperation.reportStarted();
                    shareOperation.reportCompleted(quickLink);
                }, function () {
                    console.error("Failure getting my own image for quicklink.");
                    shareOperation.reportStarted();
                    shareOperation.reportCompleted();
                });
            });
        }

        return promise;
    };
};
