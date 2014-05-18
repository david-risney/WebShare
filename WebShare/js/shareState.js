var ShareState = function () {
    var that = this,
        shareOperation,
        textToHtml = function (text) {
            return text.replace(/</g, "&lt;");
        };

    this.initializeAsync = function (shareOperationIn) {
        var results = [],
            pageScraper;

        shareOperation = shareOperationIn;

        if (shareOperation) {
            if (shareOperation.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.text)) {
                results.push(shareOperation.data.getTextAsync().then(function (text) {
                    that.selectionText = text;
                }));
            }

            if (shareOperation.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.webLink)) {
                results.push(shareOperation.data.getWebLinkAsync().then(function (webLink) {
                    try {
                        that.uri = webLink.absoluteCanonicalUri;
                    }
                    catch (e) {
                        that.uri = webLink.absoluteUri;
                        console.log("Error reading absoluteCanonicalUri of " + webLink.rawUri);
                    }
                    
                    pageScraper = new PageScraper();
                    return pageScraper.scrapeAsync(that.uri);
                }));
            }

            if (shareOperation.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.html)) {
                results.push(shareOperation.data.getHtmlFormatAsync().then(function (htmlFormat) {
                    // Extract the HTML fragment from the HTML format 
                    that.selectionHtml = Windows.ApplicationModel.DataTransfer.HtmlFormatHelper.getStaticFragment(htmlFormat);
                }));
            }
        }

        return WinJS.Promise.join(results).then(function () {
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
            }, function (xhr) {
                console.error("Failure getting image for quicklink.");

                shareOperation.reportStarted();
                shareOperation.reportCompleted();
            });
        }

        return promise;
    };
};
