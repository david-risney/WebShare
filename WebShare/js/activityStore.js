var ActivityStore = function () {
    var that = this,
        list = new WinJS.Binding.List(),
        id = 0,
        loadDefault = function (list) {
            list.push(new Activity({
                type: Activity.types.document,
                id: "" + (id++),
                name: "Facebook",
                description: "Post",
                uriTemplate: "https://www.facebook.com/sharer/sharer.php?u=%s",
                imageUri: "https://www.facebook.com/images/fb_icon_325x325.png",
                backgroundColor: "",
                usageCount: .6
            }));

            list.push(new Activity({
                type: Activity.types.selection,
                id: "" + (id++),
                name: "Twitter",
                description: "Tweet message",
                uriTemplate: "https://twitter.com/intent/tweet?text={selectionText}&tw_p=tweetbutton&url={uri}",
                imageUri: "https://abs.twimg.com/favicons/win8-tile-144.png",
                backgroundColor: "#00aced",
                usageCount: .5
            }));

            // https://developers.google.com/+/web/share/
            list.push(new Activity({
                type: Activity.types.document,
                id: "" + (id++),
                name: "Google+",
                description: "Share link",
                uriTemplate: "https://plus.google.com/share?url={uri}",
                imageUri: "https://www.gstatic.com/images/icons/gplus-64.png",
                backgroundColor: "",
                usageCount: .4
            }));

            list.push(new Activity({
                type: Activity.types.selection,
                id: "" + (id++),
                name: "Tumblr",
                description: "Post link",
                uriTemplate: "http://www.tumblr.com/share/link?url={uri}&name={uriText}&description={selectionText}",
                imageUri: "https://secure.assets.tumblr.com/images/msfavicon.png?_v=1264dab417c706a8be8f641f391ed007",
                backgroundColor: "#2c4762",
                usageCount: .3
            }));

            // http://staff.tumblr.com/post/5338138025/tumblr-share-button
            list.push(new Activity({
                type: Activity.types.document,
                id: "" + (id++),
                name: "Tumblr",
                description: "Post video",
                uriTemplate: "http://www.tumblr.com/share/video?embed={selectionHtml}&caption={uriText}",
                imageUri: "https://secure.assets.tumblr.com/images/msfavicon.png?_v=1264dab417c706a8be8f641f391ed007",
                backgroundColor: "#2c4762",
                usageCount: .3
            }));

            list.push(new Activity({
                type: Activity.types.document,
                id: "" + (id++),
                name: "Reddit",
                description: "Submit link",
                uriTemplate: "http://reddit.com/submit?url={uri}&title={uriText}",
                imageUri: "http://www.redditstatic.com/icon-touch.png",
                backgroundColor: "",
                usageCount: .2
            }));

            list.push(new Activity({
                type: Activity.types.document,
                id: "" + (id++),
                name: "StumbleUpon",
                description: "Submit link",
                uriTemplate: "http://stumbleupon.com/submit?url={uri}&title={uriText}",
                imageUri: "https://nb9-stumbleupon.netdna-ssl.com/qaJ2l2fQzftVTeOGNUns8Q",
                backgroundColor: "",
                usageCount: .2
            }));

            // http://support.addthis.com/customer/portal/articles/381265-addthis-sharing-endpoints#.U3RK3fldX7E
            list.push(new Activity({
                type: Activity.types.document,
                id: "" + (id++),
                name: "AddThis",
                description: "Share link",
                uriTemplate: "http://api.addthis.com/oexchange/0.8/offer?url={uri}&title={uriText}&description={selectionText}",
                imageUri: "http://cache.addthiscdn.com/www/140514127880/images/addthis_57x57.png",
                backgroundColor: "",
                usageCount: .1
            }));

            // https://developers.google.com/chart/infographics/docs/qr_codes
            list.push(new Activity({
                type: Activity.types.document,
                id: "" + (id++),
                name: "Google",
                description: "Show QR code",
                uriTemplate: "http://chart.apis.google.com/chart?chs=320x240&cht=qr&chl={uri}&choe=UTF-8",
                imageUri: "https://developers.google.com/_static/8b217e58ab/images/apple-touch-icon.png",
                backgroundColor: "",
                usageCount: 0
            }));

            // https://getsatisfaction.com/feedly/topics/subscribe_to_something_in_feedly_using_the_chrome_rss_subscription_extension
            // http://www.feedly.com/factory.html
            /*
            list.push(new Activity({
                type: Activity.types.document,
                id: "" + (id++),
                name: "Feedly",
                description: "Subscribe to feed",
                uriTemplate: "http://cloud.feedly.com/#subscription/feed/%s",
                imageUri: "http://s3.feedly.com/img/feedly-512.png",
                backgroundColor: "white"
            }));
            */
        },
        normalizeList = function (list) {
            list.sort(function (left, right) { return -((left.usageCount || 0) - (right.usageCount || 0)); });
        },
        clearList = function (list) {
            list.splice(0, list.length);
        };

    this.initializeAsync = function () {
        return that.loadAsync();
    };
    this.saveAsync = function () {
        var storageFile,
            serializedStateAsJson = JSON.stringify(list.map(function (item) {
            return item.serialize();
        }));
        return Windows.Storage.ApplicationData.current.roamingFolder.createFileAsync("activities.json", Windows.Storage.CreationCollisionOption.replaceExisting).then(function (storageFileIn) {
            storageFile = storageFileIn;
            return Windows.Storage.FileIO.writeTextAsync(storageFile, serializedStateAsJson);
        });
    };
    this.loadAsync = function () {
        console.log(Windows.Storage.ApplicationData.current.roamingFolder.path);
        return Windows.Storage.ApplicationData.current.roamingFolder.getItemAsync("activities.json").then(function (storageFile) {
            return Windows.Storage.FileIO.readTextAsync(storageFile);
        }).then(function (serializedStateAsJson) {
            var newList = JSON.parse(serializedStateAsJson).map(Activity.deserialize);
            normalizeList(newList);

            clearList(list);
            newList.forEach(function (activity) {
                list.push(activity);
            });
        }).then(undefined, function() {
            return that.resetAsync();
        });
    };
    this.resetAsync = function () {
        clearList(list);
        loadDefault(list);
        return that.saveAsync();
    };
    this.getItems = function () {
        return list;
    };
    this.getItemById = function (id) {
        return list.filter(function (item) {
            return item.id === id;
        })[0];
    };
    this.noteItemUsage = function (id) {
        that.getItemById(id).usageCount++;
        normalizeList(list);
        that.saveAsync();
    };
};