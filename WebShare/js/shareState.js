var ShareState = function () {
    var that = this;
    this.initializeAsync = function (shareOperation) {
        var result = WinJS.Promise.wrap();

        if (shareOperation) {
            if (shareOperation.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.text)) {
                result = result.then(function () {
                    return shareOperation.data.getTextAsync();
                }).then(function (text) {
                    that.selectionText = text;
                });
            }

            if (shareOperation.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.webLink)) {
                result = result.then(function () {
                    return shareOperation.data.getWebLinkAsync();
                }).then(function (webLink) {
                    that.uri = webLink.absoluteCanonicalUri;
                });
            }

            if (shareOperation.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.html)) {
                result = result.then(function () {
                    return shareOperation.data.getHtmlFormatAsync();
                }).then(function (htmlFormat) {
                    // Extract the HTML fragment from the HTML format 
                    that.selectionHtml = Windows.ApplicationModel.DataTransfer.HtmlFormatHelper.getStaticFragment(htmlFormat);
                });
            }
        }
    };
};