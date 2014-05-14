var ActivityStore = function () {
    var that = this,
        list = new WinJS.Binding.List();

    this.initializeAsync = function () {
        var id = 0;
        list.push(new Activity({ 
            type: Activity.types.document, 
            id: "" + (id++), 
            name: "Show QR Code", 
            uriTemplate: "http://chart.apis.google.com/chart?chs=320x240&cht=qr&chl={uri}&choe=UTF-8",
            imageUri: "https://developers.google.com/_static/8b217e58ab/images/apple-touch-icon.png"
        }));

        list.push(new Activity({
            type: Activity.types.selection,
            id: "" + (id++),
            name: "Tweet on Twitter",
            uriTemplate: "https://twitter.com/intent/tweet?text={selectionText}&tw_p=tweetbutton&url={uri}",
            imageUri: "https://abs.twimg.com/favicons/win8-tile-144.png"
        }));

        list.push(new Activity({
            type: Activity.types.selection,
            id: "" + (id++),
            name: "Post link on Tumblr",
            uriTemplate: "http://www.tumblr.com/share/link?url={uri}&name={uriText}&description={selectionText}",
            imageUri: "https://secure.assets.tumblr.com/images/msfavicon.png?_v=1264dab417c706a8be8f641f391ed007"
        }));

        // http://staff.tumblr.com/post/5338138025/tumblr-share-button
        list.push(new Activity({
            type: Activity.types.document,
            id: "" + (id++),
            name: "Post video on Tumblr",
            uriTemplate: "http://www.tumblr.com/share/video?embed={selectionHtml}&caption={uriText}",
            imageUri: "https://secure.assets.tumblr.com/images/msfavicon.png?_v=1264dab417c706a8be8f641f391ed007"
        }));

        return that.loadAsync();
    };
    this.saveAsync = function () {
        return WinJS.Promise.wrap();
    };
    this.loadAsync = function () {
        return WinJS.Promise.wrap();
    };
    this.getItems = function () {
        return list;
    };
    this.getItemById = function (id) {
        return list.filter(function (item) {
            return item.id === id;
        })[0];
    };
};