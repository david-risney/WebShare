var ImageUtils = (function () {
    var ImageUtils = {};

    ImageUtils.drawImageWithBackgroundColorAsync = function (imageUri, backgroundColor) {
        var signal = new SignalPromise(),
            image = document.createElement("img");

        image.onerror = function () { signal.error(); };
        image.onload = function () { signal.complete(image); };
        image.src = imageUri;

        return signal.promise.then(function (image) {
            var canvas = document.createElement("canvas"),
                context;
            
            canvas.width = image.width;
            canvas.height = image.height;

            context = canvas.getContext("2d");

            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, image.width, image.height);
            context.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width, image.height);
            return canvas.msToBlob();
        });
    };

    ImageUtils.pickBestImageAsync = function (uriList) {
        var uriResultList = [],
            signal = new SignalPromise(),
            count = 0,
            incrementAndCheckCompletionCount = function () {
                if (++count === uriList.length) {
                    uriResultList.sort(function (left, right) {
                        if (left.success !== right.success) {
                            return left.success ? -1 : 1;
                        }
                        else if (left.success) {
                            return right.result - left.result;
                        }
                        else {
                            return 0;
                        }
                    });
                    signal.complete(uriResultList[0].uri);
                }
            };

        uriList.map(function (uri) {
            var signal = new SignalPromise(),
                img = document.createElement("img");
            img.onerror = function () { signal.error(); };
            img.onload = function () { signal.complete(img.width * img.height); };
            img.src = uri;

            return signal.promise;
        }).forEach(function (promise, idx) {
            promise.done(function (result) {
                uriResultList[idx] = { uri: uriList[idx], success: true, result: result };
                incrementAndCheckCompletionCount();
            }, function (error) {
                uriResultList[idx] = { uri: uriList[idx], success: false, result: error };
                incrementAndCheckCompletionCount();
            });
        });

        return signal.promise;
    };


    return ImageUtils;
}());