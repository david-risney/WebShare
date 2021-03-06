﻿var SettingsPane = function () {
    this.initializeAsync = function (activityStore) {
        var settingsPane = Windows.UI.ApplicationSettings.SettingsPane.getForCurrentView(),
            analytics = { trackEvent: function () { } },
            uriBase = "http://deletethis.net/dave/dev/cloudShare/",
            appName = "Cloud Share";

        settingsPane.addEventListener(
            "commandsrequested",
            function (settingsPaneCommandsRequestArgs) {
                var applicationCommands = settingsPaneCommandsRequestArgs.request.applicationCommands;

                if (applicationCommands.size == 0) {
                    applicationCommands.append(new Windows.UI.ApplicationSettings.SettingsCommand("about", "About",
                        function () {
                            Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(uriBase + "about.html#about"));
                            analytics.trackEvent("UI", "click", "about", 1);
                        }));
                    applicationCommands.append(new Windows.UI.ApplicationSettings.SettingsCommand("privacyPolicy", "Privacy Policy",
                        function () {
                            Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(uriBase + "about.html#privacy"));
                            analytics.trackEvent("UI", "click", "privacyPolicy", 1);
                        }));
                    applicationCommands.append(new Windows.UI.ApplicationSettings.SettingsCommand("resetState", "Reset Application State",
                        function () {
                            var dialog = new Windows.UI.Popups.MessageDialog(
                                "Would you like to reset all of your application's state back to what it was when you first installed?",
                                appName);
                            dialog.commands.append(new Windows.UI.Popups.UICommand("Reset State", function () {

                                activityStore.resetAsync().done(undefined, function (e) {
                                    console.error("Error resetting state: " + e);
                                });
                                analytics.trackEvent("UI", "click", "resetState", 1);
                            }));
                            dialog.commands.append(new Windows.UI.Popups.UICommand("Never Mind"));
                            dialog.showAsync().done(null, function () { });
                        }));
                    applicationCommands.append(new Windows.UI.ApplicationSettings.SettingsCommand("help", "Help",
                        function () {
                            Windows.System.Launcher.launchUriAsync(new Windows.Foundation.Uri(uriBase + "about.html#help"));
                            analytics.trackEvent("UI", "click", "help", 1);
                        }));
                }
            });
        return WinJS.Promise.wrap();
    };
};