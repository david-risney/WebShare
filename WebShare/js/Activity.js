var Activity = function Activity(activityState) {
    var that = this;

    this.type = activityState.type;
    this.id = activityState.id;
    this.name = activityState.name;
    this.description = activityState.description;
    this.imageUri = activityState.imageUri;
    this.backgroundColor = activityState.backgroundColor;
    this.uriTemplate = activityState.uriTemplate;
    this.usageCount = activityState.usageCount || 0;

    this.serialize = function () { return this; };

    this.toUri = function (shareState) {
        var uri = that.uriTemplate;
        uri = UriTemplate.printfTemplateToUri(uri, shareState.uri || shareState.uriText || shareState.selectionText);
        uri = UriTemplate.uriTemplateToUri(uri, {
            uri: shareState.uri,
            uriText: shareState.uriText,
            uriHtml: shareState.uriHtml,
            selectionText: shareState.selectionText,
            selectionHtml: shareState.selectionHtml
        });
        return uri;
    }
};

Activity.types = ["document", "link", "selection"].reduce(function (types, name) {
    types[name] = name;
    return types;
}, {});

Activity.deserialize = function (activityState) { return new Activity(activityState); };