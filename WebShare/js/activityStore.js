var ActivityStore = function () {
    var that = this,
        list = new WinJS.Binding.List(),
        selectedId,
        diskSerializer = new AsyncReentrancyGuard.PromiseSerializer(),
        saveInTheBackground = function () {
            diskSerializer.startLastAsync(function () {
                that.saveAsync().done(undefined, function (e) {
                    console.error(e);
                });
            });
        },
        loadDefault = function (list) {
            list.push(new Activity({
                type: Activity.types.document,
                name: "Facebook",
                description: "Post",
                uriTemplate: "https://www.facebook.com/sharer/sharer.php?u=%s",
                imageUri: "https://www.facebook.com/images/fb_icon_325x325.png",
                backgroundColor: "",
                usageCount: .6
            }));

            list.push(new Activity({
                type: Activity.types.selection,
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
                name: "Google+",
                description: "Share link",
                uriTemplate: "https://plus.google.com/share?url={uri}",
                imageUri: "https://www.gstatic.com/images/icons/gplus-64.png",
                backgroundColor: "",
                usageCount: .4
            }));

            list.push(new Activity({
                type: Activity.types.selection,
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
                name: "Tumblr",
                description: "Post video",
                uriTemplate: "http://www.tumblr.com/share/video?embed={selectionHtml}&caption={uriText}",
                imageUri: "https://secure.assets.tumblr.com/images/msfavicon.png?_v=1264dab417c706a8be8f641f391ed007",
                backgroundColor: "#2c4762",
                usageCount: .3
            }));

            list.push(new Activity({
                type: Activity.types.document,
                name: "Reddit",
                description: "Submit link",
                uriTemplate: "http://reddit.com/submit?url={uri}&title={uriText}",
                imageUri: "http://www.redditstatic.com/icon-touch.png",
                backgroundColor: "",
                usageCount: .2
            }));

            list.push(new Activity({
                type: Activity.types.document,
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
                name: "Feedly",
                description: "Subscribe to feed",
                uriTemplate: "http://cloud.feedly.com/#subscription/feed/%s",
                imageUri: "http://s3.feedly.com/img/feedly-512.png",
                backgroundColor: "white"
            }));
            */
        },
        normalizeList = function (list) {
            // list.sort(function (left, right) { return -((left.usageCount || 0) - (right.usageCount || 0)); });
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
        if (serializedStateAsJson && serializedStateAsJson.length) {
            return Windows.Storage.ApplicationData.current.localFolder.createFileAsync("activities.new.json", Windows.Storage.CreationCollisionOption.replaceExisting).then(function (storageFileIn) {
                storageFile = storageFileIn;
                return Windows.Storage.FileIO.writeTextAsync(storageFile, serializedStateAsJson);
            }).then(function () {
                return storageFile.getBasicPropertiesAsync();
            }).then(function (basicProperties) {
                if (basicProperties.size > 0) {
                    return Windows.Storage.ApplicationData.current.roamingFolder.createFileAsync("activities.json", Windows.Storage.CreationCollisionOption.replaceExisting);
                }
                else {
                    console.error("Not keeping new zero sized file.");
                }
            }).then(function (realStorageFile) {
                return storageFile.moveAndReplaceAsync(realStorageFile);
            });
        }
        else {
            console.error("Error serializaing state.");
        }
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
        }).then(undefined, function (e) {
            console.error("Error loading activities. Resetting to defaults: " + e);
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
    this.removeItemById = function (id) {
        var idx = list.indexOf(that.getItemById(id));
        list.splice(idx, 1);
        saveInTheBackground();
    };
    this.addItem = function () {
        var activityIdx = list.push(new Activity({
            type: Activity.types.document,
            name: "Example",
            description: "Post",
            uriTemplate: "about:blank?link={uri}&name={uriText}&description={selectionText}",
            imageUri: "http://example.com/favicon.ico",
            backgroundColor: "white",
            usageCount: 0
        }));
        saveInTheBackground();
        return list.getAt(activityIdx - 1).id;
    };
    this.noteItemUsage = function (id) {
        that.getItemById(id).usageCount++;
        var item = that.getItemById(id),
            idx = list.indexOf(item);
        list.splice(idx, 1);
        list.splice(0, 0, item);
        //normalizeList(list);
        list.notifyReload();
        saveInTheBackground();
    };
    this.noteItemUpdate = function (id) {
        //list.notifyMutated(list.indexOf(that.getItemById(id)));
        list.notifyReload();
        saveInTheBackground();
    };
    this.setSelectedId = function (id) {
        selectedId = id;
    };
    this.getSelectedId = function () {
        return selectedId;
    };
};
