var ActivityRunner = function () {
    var activityStore,
        activityList,
        activityOutput,
        activityOutputStates = ["hidden", "loading", "done"].reduce(function (states, name) {
            states[name] = name;
            return states;
        }, {}),
        shareState,
        removeActivityOutputStateChangeHandler,
        runningActivity = false,
        activityOutputState = activityOutputStates.hidden,
        updateActivityElement = function (activityElement) {
            var selected = parseInt(activityElement.getAttribute("name"), 10) == activityStore.getSelectedId();
            if (selected) {
                activityElement.classList.add("selected");
            }
            else {
                activityElement.classList.remove("selected");
            }
            var icon = activityElement.querySelector(".icon");
            icon.onerror = function () { icon.removeAttribute("src"); };
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
        activitySelectionHandler = function (activityId) {
            runningActivity = !runningActivity;
            if (runningActivity) {
                activityStore.setSelectedId(activityId);
                document.body.parentElement.classList.add("selected");
                transitionToActivityOutputState(activityOutputStates.loading);
                activityOutput.src = activityStore.getItemById(activityId).toUri(shareState);
                activityStore.noteItemUsage(activityId);
            }
            else {
                document.body.parentElement.classList.remove("selected");
                transitionToActivityOutputState(activityOutputStates.hidden);
            }
        },
        activityClickHandler = function (event) {
            var activityId = parseInt(event.currentTarget.getAttribute("name"), 10);
            return activitySelectionHandler(activityId);
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

        activityOutput.addEventListener("MSWebViewNavigationStart", function () {
            if (activityOutputState === activityOutputStates.done) {
                activityOutputProgress.style.display = "block";
            }
        });
        activityOutput.addEventListener("MSWebViewContentLoading", function () {
            if (activityOutputState === activityOutputStates.done) {
                activityOutputProgress.style.display = "block";
            }
        });
        activityOutput.addEventListener("MSWebViewNavigationCompleted", function () {
            if (activityOutputState === activityOutputStates.done) {
                activityOutputProgress.style.display = "none";
            }
        });
    };
    this.unselect = function () {
        activitySelectionHandler(activityStore.getSelectedId());
    };
    this.select = function (id) {
        activitySelectionHandler(id);
    };
};
