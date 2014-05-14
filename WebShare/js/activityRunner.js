var ActivityRunner = function () {
    var activityStore,
        activityList,
        activityOutput,
        activityOutputStates = ["hidden", "loading", "done"].reduce(function (states, name) {
            states[name] = name;
            return states;
        }, {}),
        removeActivityOutputStateChangeHandler,
        runningActivity = false,
        activityOutputState = activityOutputStates.hidden,
        unhideActivities = function () {
            Array.prototype.forEach.call(activityList.element.querySelectorAll("#activityList > *"), function (activity) {
                activity.classList.remove("activity-hide");
            });
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
                hideNonSelectedActivities(event.currentTarget);
                transitionToActivityOutputState(activityOutputStates.loading);
                activityOutput.src = activityStore.getItemById(activityId).toUri({ uri: "http://deletethis.net/dave/" });
            }
            else {
                unhideActivities();
                transitionToActivityOutputState(activityOutputStates.hidden);
            }
        };

    this.initializeAsync = function (activityStoreIn, activityListIn, activityOutputIn) {
        var addClickHandler = function (item) { item.addEventListener("click", activityClickHandler); };

        activityStore = activityStoreIn;
        activityList = activityListIn;
        activityOutput = activityOutputIn;

        activityList.onitemsloaded = function (detail) {
            Array.prototype.forEach.call(detail.target.children, function (child) {
                addClickHandler(child);
            });
        }
        activityList.oniteminserted = function (detail) {
            addClickHandler(detail.affectedElement);
        };
    };
};