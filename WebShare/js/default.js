// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application,
        activation = Windows.ApplicationModel.Activation,
        activityStore = new ActivityStore(),
        activityRunner = new ActivityRunner(),
        shareState = new ShareState(),
        settingsPane = new SettingsPane(),
        appBar = new AppBar(),
        activityList;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.shareTarget) {
            document.body.parentElement.classList.add("share");
        }
        console.log("Starting activation " + args.detail.kind);

        args.setPromise(WinJS.Promise.join([
            WinJS.UI.processAll()
        ]).then(function () {
            console.log("Activation point -1");
            return shareState.initializeAsync(args.detail.shareOperation);
        }).then(function() {
            console.log("Activation point 0");
            return activityStore.initializeAsync();
        }).then(function(){
            console.log("Activation point 1");
            activityList = document.getElementById("activityList").winControl;
            return activityRunner.initializeAsync(
                shareState,
                activityStore,
                activityList,
                document.getElementById("activityOutput"));
        }).then(function () {
            console.log("Activation point 2");
            return appBar.initializeAsync(
                shareState,
                activityStore,
                activityRunner,
                document.getElementById("appBar"),
                document.getElementById("editActivityFlyout"),
                document.getElementById("addActivityFlyout"),
                document.getElementById("cancelSelection"),
                document.getElementById("doneSharing"),
                document.getElementById("openInBrowser"));
        }).then(function () {
            return settingsPane.initializeAsync(activityStore);
        }).then(function() {
            console.log("Activation complete");
            activityList.data = activityStore.getItems();

            if (args.detail.shareOperation && args.detail.shareOperation.quickLinkId) {
                try {
                    activityRunner.select(activityStore.getItemByUriTemplate(args.detail.shareOperation.quickLinkId).id);
                }
                catch (e) {
                    console.error("Error selecting quick link id: " + args.detail.shareOperation.quickLinkId);
                }
            }
        }));
    };

    app.oncheckpoint = function () {
        activityStore.saveAsync().done(function () {
            console.log("checkpoint save done");
        }, function (e) {
            console.error("checkpoint save failed: " + e);
        });
    }

    app.start();
})();
