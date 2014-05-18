var AppBar = function () {
    this.initializeAsync = function (shareState, activityStore, activityRunner, appBarElement, editActivityFlyoutElement, addActivityFlyoutElement, cancelButton, doneButton, browserButton) {
        var deleteActivityHandler = function () {
                activityStore.removeItemById(activityStore.getSelectedId());
                activityRunner.unselect();
            },
            cancelHandler = function () {
                activityRunner.unselect();
            },
            doneHandler = function () {
                activityRunner.unselect();
                shareState.completeSharingAsync(activityStore.getItemById(activityStore.getSelectedId())).done();
            },
            browserHandler = function () {
                Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(activityOutput.src)).then(doneHandler, doneHandler).done();
            },
            uriRemovePathQueryFragment = function (uriWithStuff) {
                var uriWithoutStuff = new Windows.Foundation.Uri(uriWithStuff, "/"),
                    uriWithoutStuffAsString;

                try {
                    uriWithoutStuffAsString = uriWithoutStuff.absoluteCanonicalUri;
                }
                catch (e) {
                    uriWithoutStuffAsString = uriWithoutStuff.absoluteUri;
                }

                return uriWithoutStuffAsString;
            }
            addActivityHandler = function () {
                var uriTemplate = addActivityFlyoutElement.querySelector("#addActivityFlyoutUriTemplate").value,
                    progress = addActivityFlyoutElement.querySelector("#addActivityFlyoutProgress"),
                    scraperPage = new PageScraper(),
                    scraperSite = new PageScraper(),
                    bestImageUri,
                    addActivityPickImages = function () {
                        var promise = WinJS.Promise.wrap();
                        if (scraperPage.siteImageUri.length || scraperSite.siteImageUri.length) {
                            promise = ImageUtils.pickBestImageAsync(scraperPage.siteImageUri.concat(scraperSite.siteImageUri));
                        }
                        return promise.then(function (bestImageUriIn) {
                            bestImageUri = bestImageUriIn;
                            return addActivityPostScrape();
                        }, addActivityPostScrape);
                    },
                    addActivityPostScrape = function () {
                        var id = activityStore.addItem(),
                            newActivity = activityStore.getItemById(id);

                        newActivity.name = scraperSite.siteName[0] || scraperSite.pageName[0] || scraperPage.siteName[0] || scraperPage.pageName[0] || "Unknown";
                        newActivity.description = scraperPage.pageName[0] || scraperPage.siteName[0] || scraperSite.pageName[0] || scraperSite.siteName[0] || "Unknown";
                        newActivity.imageUri = bestImageUri || scraperPage.siteImageUri[0] || scraperSite.siteImageUri[0] || "";
                        newActivity.backgroundColor = scraperPage.siteBackgroundColor[0] || scraperSite.siteBackgroundColor[0] || "";
                        newActivity.uriTemplate = uriTemplate;

                        activityStore.noteItemUpdate(id);

                        activityRunner.select(id);
                        document.getElementById("editActivity").click();

                        addActivityFlyoutProgress.style.display = "none";
                    };

                addActivityFlyoutProgress.style.display = "block";
                
                return WinJS.Promise.join([
                    scraperPage.scrapeAsync(uriTemplate),
                    scraperSite.scrapeAsync(uriRemovePathQueryFragment(uriTemplate)),
                ]).then(addActivityPickImages, addActivityPostScrape);
            },
            editActivityFlyoutHandlers = (function () {
                var editActivityFlyoutUriTemplate = document.getElementById("editActivityFlyoutUriTemplate"),
                    editActivityFlyoutName = document.getElementById("editActivityFlyoutName"),
                    editActivityFlyoutDescription = document.getElementById("editActivityFlyoutDescription"),
                    editActivityFlyoutImageUri = document.getElementById("editActivityFlyoutImageUri"),
                    editActivityFlyoutBackgroundColor = document.getElementById("editActivityFlyoutBackgroundColor");

                return {
                    saveHandler: function () {
                        var activityId = activityStore.getSelectedId(),
                            activity = activityStore.getItemById(activityId);

                        activity.name = editActivityFlyoutName.value;
                        activity.description = editActivityFlyoutDescription.value;
                        activity.uriTemplate = editActivityFlyoutUriTemplate.value;
                        activity.imageUri = editActivityFlyoutImageUri.value;
                        activity.backgroundColor = editActivityFlyoutBackgroundColor.value;

                        activityStore.noteItemUpdate(activityId);

                        activityRunner.unselect();
                        editActivityFlyoutElement.winControl.hide();
                    },
                    openHandler: function () {
                        var activityId = activityStore.getSelectedId(),
                            activity = activityStore.getItemById(activityId);

                        editActivityFlyoutName.value = activity.name;
                        editActivityFlyoutDescription.value = activity.description;
                        editActivityFlyoutUriTemplate.value = activity.uriTemplate;
                        editActivityFlyoutImageUri.value = activity.imageUri;
                        editActivityFlyoutBackgroundColor.value = activity.backgroundColor;
                    }
                };
            }());

        appBarElement.querySelector("#deleteActivity").addEventListener("click", deleteActivityHandler);
        addActivityFlyoutElement.querySelector("#addActivityFlyoutAdd").addEventListener("click", addActivityHandler);
        editActivityFlyoutElement.querySelector("#editActivityFlyoutSave").addEventListener("click", editActivityFlyoutHandlers.saveHandler);
        editActivityFlyoutElement.winControl.addEventListener("beforeshow", editActivityFlyoutHandlers.openHandler);
        cancelButton.addEventListener("click", cancelHandler);
        doneButton.addEventListener("click", doneHandler);
        browserButton.addEventListener("click", browserHandler);
    };
};