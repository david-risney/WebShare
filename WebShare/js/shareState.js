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
};
