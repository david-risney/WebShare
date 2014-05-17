var ShareState = function () {
    var that = this,
        textToHtml = function (text) {
            return text.replace(/</g, "&lt;");
        };

    this.initializeAsync = function (shareOperation) {
        var results = [],
            pageScraper;

        if (shareOperation) {
            if (shareOperation.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.text)) {
                results.push(shareOperation.data.getTextAsync().then(function (text) {
                    that.selectionText = text;
                }));
            }

            if (shareOperation.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.webLink)) {
                results.push(shareOperation.data.getWebLinkAsync().then(function (webLink) {
                    that.uri = webLink.absoluteCanonicalUri;
                    
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
                if (!that.selectionHtml && !that.selectionText && (pageScraper.selectionText || pageScraper.selectionImageUri)) {
                    if (pageScraper.selectionText) {
                        that.selectionText = pageScraper.selectionText;
                        that.selectionHtml = textToHtml(pageScraper.selectionText);
                        if (pageScraper.selectionImageUri) {
                            that.selectionText += " ";
                        }
                    }
                    if (pageScraper.selectionImageUri) {
                        that.selectionText += pageScraper.selectionImageUri;
                        that.selectionHtml += "<img src=\"" + pageScraper.selectionImageUri +"\">";
                    }
                }

                if (!that.uriText && (pageScraper.siteName || pageScraper.pageName)) {
                    that.uriText = "";
                    if (pageScraper.siteName) {
                        that.uriText += pageScraper.siteName;
                        if (pageScraper.pageName) {
                            that.uriText += " - ";
                        }
                    }
                    if (pageScraper.pageName) {
                        that.uriText += pageScraper.pageName;
                    }
                }
            }
        });
    };
};