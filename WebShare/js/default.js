// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application,
        activation = Windows.ApplicationModel.Activation,
        activityStore = new ActivityStore(),
        activityRunner = new ActivityRunner(),
        shareState = new ShareState(),
        appBar = new AppBar(),
        activityList;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.shareTarget) {
            document.body.parentElement.classList.add("share");
        }

        args.setPromise(activityStore.initializeAsync().then(function () {
            return WinJS.UI.processAll();
        }).then(function () {
            return shareState.initializeAsync(args.detail.shareOperation);
        }).then(function() {
            activityList = document.getElementById("activityList").winControl;
            return activityRunner.initializeAsync(
                shareState,
                activityStore,
                activityList,
                document.getElementById("activityOutput"));
        }).then(function () {
            return appBar.initializeAsync(activityStore, activityRunner, document.getElementById("appBar"), document.getElementById("editActivityFlyout"));
        }).then(function() {
            activityList.data = activityStore.getItems();
        }));
    };

    app.oncheckpoint = function () {
        activityStore.saveAsync();
    }

    app.start();
})();
