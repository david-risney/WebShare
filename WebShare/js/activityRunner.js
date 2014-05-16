var ActivityRunner = function () {
    var activityStore,
        activityList,
        activityOutput,
        activityOutputStates = ["hidden", "loading", "done"].reduce(function (states, name) {
            states[name] = name;
            return states;
        }, {}),
        shareState,
        selectedActivityId,
        removeActivityOutputStateChangeHandler,
        runningActivity = false,
        activityOutputState = activityOutputStates.hidden,
        updateActivityElement = function (activityElement) {
            var selected = activityElement.getAttribute("name") == selectedActivityId;
            if (selected) {
                activityElement.classList.add("selected");
            }
            else {
                activityElement.classList.remove("selected");
            }
        },
        hideNonSelectedActivities = function (selectedActivity) {
            Array.prototype.forEach.call(activityList.element.querySelectorAll("#activityList > *"), function (activity) {
                if (activity === selectedActivity) {
                    activity.classList.remove("activity-hide");
                }
                else {
                    activity.classList.add("activity-hide");
                }
            });
        },
        transitionToActivityOutputState = function (state) {
            var activityOutputProgress = document.getElementById("activityOutputProgress"),
                handler;

            if (state !== activityOutputState) {
                if (removeActivityOutputStateChangeHandler) {
                    removeActivityOutputStateChangeHandler();
                }

                switch (state) {
                    case activityOutputStates.hidden:
                        activityOutput.style.display = "none";
                        activityOutputProgress.style.display = "none";
                        break;

                    case activityOutputStates.loading:
                        handler = function () {
                            transitionToActivityOutputState(activityOutputStates.done);
                        }
                        activityOutput.addEventListener("MSWebViewDOMContentLoaded", handler);
                        removeActivityOutputStateChangeHandler = function () {
                            activityOutput.removeEventListener("MSWebViewDOMContentLoaded", handler);
                        }
                        activityOutput.style.display = "none";
                        activityOutputProgress.style.display = "block";
                        break;

                    case activityOutputStates.done:
                        activityOutput.style.display = "block";
                        activityOutputProgress.style.display = "none";
                        break;
                }
                activityOutputState = state;
            }
        },
        activityClickHandler = function (event) {
            var activityId = activityId = event.currentTarget.getAttribute("name");

            runningActivity = !runningActivity;
            if (runningActivity) {
                selectedActivityId = activityId;
                document.body.parentElement.classList.add("selected");
                transitionToActivityOutputState(activityOutputStates.loading);
                activityOutput.src = activityStore.getItemById(activityId).toUri(shareState);
                activityStore.noteItemUsage(activityId);
                
            }
            else {
                document.body.parentElement.classList.remove("selected");
                transitionToActivityOutputState(activityOutputStates.hidden);
            }
        };

    this.initializeAsync = function (shareStateIn, activityStoreIn, activityListIn, activityOutputIn) {
        var addClickHandler = function (item) { item.addEventListener("click", activityClickHandler); };

        shareState = shareStateIn;
        activityStore = activityStoreIn;
        activityList = activityListIn;
        activityOutput = activityOutputIn;

        activityList.onitemsreloaded = activityList.onitemsloaded = function (detail) {
            Array.prototype.forEach.call(detail.target.children, function (child) {
                addClickHandler(child);
                updateActivityElement(child);
            });
        };
        activityList.onitemchanged = activityList.onitemremoved = activityList.onitemmoved = activityList.oniteminserted = function (detail) {
            addClickHandler(detail.affectedElement);
            updateActivityElement(detail.affectedElement);
        };
    };
};
