var Activity = (function () {
    var id = 0;
    function Activity(activityState) {
        var that = this;

        this.type = activityState.type;
        this.id = id++;
        this.name = activityState.name;
        this.description = activityState.description;
        this.imageUri = activityState.imageUri;
        this.backgroundColor = activityState.backgroundColor;
        this.uriTemplate = activityState.uriTemplate;
        this.usageCount = activityState.usageCount || 0;

        this.serialize = function () { return this; };

        this.toUri = function (shareState) {
            var uri = that.uriTemplate;
            uri = UriTemplate.printfTemplateToUri(uri, shareState.uri || shareState.uriText || shareState.selectionText || shareState.selectionImageUri);
            uri = UriTemplate.uriTemplateToUri(uri, {
                uri: shareState.uri,
                uriText: shareState.uriText,
                uriHtml: shareState.uriHtml,
                selectionText: shareState.selectionText,
                selectionHtml: shareState.selectionHtml,
                selectionImageUri: shareState.selectionImageUri
            });
            return uri;
        }
    };
    Activity.types = ["document", "link", "selection"].reduce(function (types, name) {
        types[name] = name;
        return types;
    }, {});

    Activity.deserialize = function (activityState) { return new Activity(activityState); };

    return Activity;
}());

