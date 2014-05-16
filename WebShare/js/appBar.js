var AppBar = function () {
    this.initializeAsync = function (activityStore, activityRunner, appBarElement, editActivityFlyoutElement) {
        var deleteActivityHandler = function () {
                activityStore.removeItemById(activityStore.getSelectedId());
                activityRunner.unselect();
            },
            addActivityHandler = function () {
                var id = activityStore.addItem();
                activityRunner.select(id);
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
        appBarElement.querySelector("#addActivity").addEventListener("click", addActivityHandler);
        editActivityFlyoutElement.querySelector("#editActivityFlyoutSave").addEventListener("click", editActivityFlyoutHandlers.saveHandler);
        editActivityFlyoutElement.winControl.addEventListener("beforeshow", editActivityFlyoutHandlers.openHandler);
    };
};