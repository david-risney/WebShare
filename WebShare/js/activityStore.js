var ActivityStore = function () {
    var that = this,
        list = new WinJS.Binding.List(),
        selectedId,
        diskSerializer = new AsyncReentrancyGuard.PromiseSerializer(),
        loadRawAsync = function () {
            console.log("Starting load from " + Windows.Storage.ApplicationData.current.roamingFolder.path + " activities.json ...");
            return Windows.Storage.ApplicationData.current.roamingFolder.getItemAsync("activities.json").then(function (storageFile) {
                console.log("Opened activities.json for loading...");
                return Windows.Storage.FileIO.readTextAsync(storageFile);
            }).then(function (serializedStateAsJson) {
                console.log("Read text from activities.json (" + serializedStateAsJson.length + " characters)");
                var newList = JSON.parse(serializedStateAsJson).map(Activity.deserialize);

                clearList(list);
                newList.forEach(function (activity) {
                    list.push(activity);
                });
            }).then(function () {
                console.log("Finished loading from file.");
            }, function (e) {
                console.error("Error loading activities. Resetting to defaults: " + e);
                return that.resetAsync();
            });
        },
        saveRawAsync = function () {
            console.log("Starting save to file.");
            var storageFile,
                serializedStateAsJson = JSON.stringify(list.map(function (item) {
                    return item.serialize();
                }));
            console.log("Saving " + serializedStateAsJson + " " + serializedStateAsJson.length + " characters.");
            if (serializedStateAsJson && serializedStateAsJson.length) {
                return Windows.Storage.ApplicationData.current.localFolder.createFileAsync("activities.new.json", Windows.Storage.CreationCollisionOption.replaceExisting).then(function (storageFileIn) {
                    console.log("Opened activities.new.json for writing.");
                    storageFile = storageFileIn;
                    return Windows.Storage.FileIO.writeTextAsync(storageFile, serializedStateAsJson);
                }).then(function () {
                    console.log("Wrote to new file.");
                    return storageFile.getBasicPropertiesAsync();
                }).then(function (basicProperties) {
                    if (basicProperties.size > 0) {
                        console.log("And now the file is " + basicProperties.size + " bytes.");
                        return Windows.Storage.ApplicationData.current.roamingFolder.createFileAsync("activities.json", Windows.Storage.CreationCollisionOption.replaceExisting);
                    }
                    else {
                        console.error("Not keeping new zero sized file.");
                    }
                }).then(function (realStorageFile) {
                    if (realStorageFile) {
                        console.log("Replaced activities.json with activities.new.json content.");
                        return storageFile.moveAndReplaceAsync(realStorageFile);
                    }
                });
            }
            else {
                console.error("Error serializaing state.");
            }
        },
        saveInTheBackground = function () {
            console.log("Starting save in background...");
            that.saveAsync().done(function () {
                console.log("Finished save in backgroud.");
            }, function (e) {
                console.error("Error save in background: " + e);
            });
        },
        addDefaults = function (list) {
            list.push(new Activity({
                type: Activity.types.document,
                name: "Facebook",
                description: "Post",
                uriTemplate: "https://www.facebook.com/sharer/sharer.php?u=%s",
                imageUri: "https://www.facebook.com/images/fb_icon_325x325.png",
                backgroundColor: "",
                usageCount: .6
            }));

            list.push(new Activity({
                type: Activity.types.selection,
                name: "Twitter",
                description: "Tweet message",
                uriTemplate: "https://twitter.com/intent/tweet?text={selectionText}&tw_p=tweetbutton&url={uri}",
                imageUri: "https://abs.twimg.com/favicons/win8-tile-144.png",
                backgroundColor: "#00aced",
                usageCount: .5
            }));

            // https://developers.google.com/+/web/share/
            list.push(new Activity({
                type: Activity.types.document,
                name: "Google+",
                description: "Share link",
                uriTemplate: "https://plus.google.com/share?url={uri}",
                imageUri: "https://www.gstatic.com/images/icons/gplus-64.png",
                backgroundColor: "",
                usageCount: .4
            }));

            list.push(new Activity({
                type: Activity.types.selection,
                name: "Tumblr",
                description: "Post link",
                uriTemplate: "http://www.tumblr.com/share/link?url={uri}&name={uriText}&description={selectionText}",
                imageUri: "https://secure.assets.tumblr.com/images/msfavicon.png?_v=1264dab417c706a8be8f641f391ed007",
                backgroundColor: "#2c4762",
                usageCount: .3
            }));

            /*
            // http://staff.tumblr.com/post/5338138025/tumblr-share-button
            list.push(new Activity({
                type: Activity.types.document,
                name: "Tumblr",
                description: "Post video",
                uriTemplate: "http://www.tumblr.com/share/video?embed={selectionHtml}&caption={uriText}",
                imageUri: "https://secure.assets.tumblr.com/images/msfavicon.png?_v=1264dab417c706a8be8f641f391ed007",
                backgroundColor: "#2c4762",
                usageCount: .3
            }));
            */

            list.push(new Activity({
                type: Activity.types.document,
                name: "Reddit",
                description: "Submit link",
                uriTemplate: "http://reddit.com/submit?url={uri}&title={uriText}",
                imageUri: "http://www.redditstatic.com/icon-touch.png",
                backgroundColor: "",
                usageCount: .2
            }));

            list.push(new Activity({
                type: Activity.types.document,
                name: "StumbleUpon",
                description: "Submit link",
                uriTemplate: "http://stumbleupon.com/submit?url={uri}&title={uriText}",
                imageUri: "https://nb9-stumbleupon.netdna-ssl.com/qaJ2l2fQzftVTeOGNUns8Q",
                backgroundColor: "",
                usageCount: .2
            }));

            list.push(new Activity({
                "type": "document",
                "name": "Blogger",
                "description": "Blog This",
                "imageUri": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAgAElEQVR4Xn2bebCdd1nHn/e8Z71LkqZNkyZ0oVtamjZt07RWSxfaFFQWoTAiMC6jMzoO/qMyjEVx/MeBIpZqK6gUZBDBhZFFsWjBYZMBStmkW5qkCU3aJHe/99x79tfP93l+77lXQA+c5tx3+b3P7/ts3+f5/d5spRgUk7Zotva02Ynvmh17zGzQM8taZpabFQXfId8+x0Yc45PxHXHcKhxv8DcHCv3mmM7pU6RrTdfpw3n/na7T2OPBGN8G3Msz/BrdW03jlP+W46Xb9CDJMKpxH/dXuF9jWM1HyPg3Hq1rGLfK83JkvXC/2QVXc/1ZnGtZVhSzhbVP2eGHP2ILB79mZ7UqNuyv2ajSst6wsDrPqVifuWtwzTOzIZPlKuaryVRslKXJjDJ+p+kmLApAycdgCCNNJLch1+U+14KxRtxXMOLQp+7PEZicqTKVkf9e/+gZoyJzrOsDPXtkRTZgjCGSCmjJxZ0opjbgOEdHAqG1yZ5brdplN/607brltWaNzQCw/MXiyc/8sxUnj9iW2tBaPsHCRvUWN0rzWAPad2ERfJS+WTGwCpOpgPqIb+GIC5ZkDSGGT0TXZZWC39K0jsW/Op/zuxhVuL/KONW43z8am6dxXs/WNcOM6zg90LfClRyrDapcxwGsx+X1uzgCAPpM1nJbXV2wCnPrIfugscWeOrlql+w/YBe87C6u+9Y7i+8+/Bk7b+uZVmeAfhdtV2u21O1xEwNl3IYQVZ4cItXTA3rcjIAgrzMCQMDFtAQCmkEjmbuKzCF0WwDcxg9wx7WY8kjmy3MqmqXudYA1KYFXwpI7CNK2rs25L5SDEuQKgCIZhowl6xkO1qySda3V4DfKfW5lzSbPfqE9dXzZbv+lX7ds+SOvLdrzc2i+agPMpdrA9EdMrFaz7qBrVSZYGUkL0n7SlORTTOAxFQCR3ZemX2rXxdWkk+uE+Iwh6V2/aNy1iTsxgaqsRO7CBCoOWrgJf/AUxSQm6OdzB6gi39c1bk1IJkWUrsYYowy5+FRxLSu61usuWHOiZR0kbvPgxW7Frrr+xZbN/+VLsfcIFLVaHWWg/ZUla01ttkF3zWo+WWlNAVEDCwQpBaE0R4KgjvkhhNFkCiYusw8LCHMP00RgtFK4zWCOPhZa57raUFbGfQCWySLkXAwru3Fto2GNLW1XmUAVABSDejxrxIkq8pRxKQOgoRHwXCbiWM6YWHK327bGxKT1K3U7Ob9iL9r3E5adeuDlRb2uSDqw1c4iIAjZUFxDv/tMgIcoeEloNz8XL8w5y6r4Z2i1kjKBgp6Ad28Utsn8FegUpATYUJlD9/hEIhBK7AiSblQpHwgMnuuxpJIAiEikyNOvaDxZqABMMQYrsazJaFgL5wfdVZIAAOr6ITIDwCKufune6yyb+atXF10uqBHu8zyzQb9jVWJABQmGfVwiaVeTiMmHj0kgF8qzWvi+JitndZPm/tBIpDXdpan1mXhoNaxG12ZJ8NBYCYAA9zDpAa3QpPRb0/JrAoAe42XIVksBWTEn4MGaPaZgb1yTuytyJhcoNTs5N2eXXXcjALzvZePw4gLxlfbiI+Q18RFxoWdVXITw4ClmhJ9JnBH+lZTpKdKP8TCNU+XvyBYyonJQjbkeJEfWRdAuAspnOa44xkPcykDXUy3xKcur1sEaK/zuD4lNVTQr61L2UURBswJcX3c1UrP/6+7ETHh+LpcisOSMtbS8Ypdcs9+yuffdVii9yO9cJ2NBA4JqrWkra21iQoN00vbYKreuVJt+vlYdevAcMaiMuMsD+q5E2AMW5A93q8D3pY0kUFgMmQTTHI268I3MGvWGNSXlkAH4us/ndVslFkFJMF0ss4HJM85qp23NFv48JA1yrjYke6WM4TyB8TQvcRY9K2eAXO7yIwC89xaJpal4kCtjdJALs64CTpWcikAYIqGiZxNE0+XVVXcZZYMhWllqD2ypz7VT51htertVJrZYFeIR+T3FByxJ5u5ugZkpoA01UTTanj9mSzOHIDbLdtb0lE1WCa4dIkamYIZyECHjnjUCWb1Fhuq1kbfGsUkHNcdCpXMnRNKjc4Vw00zETRaQkWo5mRPo51ewgKuJAXMlAKK0TinCv2T2Q/kC6WQEelXuFMmsE3B6vQ4MGAGxgoV21zoIsnXHhbb9Eigm/9r0DljXFsbBrCV5GQHkBcrVesY4ZXF+0OHQstnKc7by9Lft6H8/av2lGdtSb9qUfJZJDJmwGwdgZdDaCpY98GEaDmSuWE2I1fgKtiJLwRXC9fIhrFIBUbEJq3IArtln2ex7D6SQEsxJzM4JhUCQ4FDiotezSUV7hKih9QKLWMLEnl9FkDMut8uvu8OqF+4Orl2lhsjlHvJN+XrJ7CIYRhCR5HEawuHPxY88FVuNc6uzNvudL9nhR//TWmsAAYubVoDukJYRXtSrJ924U0s5sjBpOlKw+IMmLyDKGCQXUPAbcn1RBYD28kYAgj4q3Sl/BwCSkVzd5wEg18K/lGaEYA+afKKT2ZZLbrRzb349k96Kspm0fI4HjXhQFRVxq/MIfcauVcbCBMCQ4JUjkKIFVICsAyYqigazZvNH7JmH/8GWjn3fzpmsgU3PMxMm4GNLRTmUOIKsUmSEwQAh0reCb1XgqOZAJoUXATDbXrHdsoC5v7jdg3KknHXSU3J+BwKzmyRYyZz6+YQ9szSybXsO2Hl3/gInp5B6wu1RJCdXvEhpUuknkt/6R/N2IRMoTMWtZERmEQi6JZdGxf6KFbPFY3b8cx+32UPftK2twhoiPrig0pmuHZBBPHaRJjNcURS4pMpSq1uI6glcQFlFliMAZlaX7IqryQKzD9zmOiktNcwoUog4ulLSZItI3D5uWWPKTnWn7axLbrLtd74JaTd7jHCWmCrCkrPH3CPYBbLhUuXkZWNKUDVRal2CdnTeQeBLcgGpNf5YxSWet6c+/UHrnjpoZ9e5orOAZdXJNjIZ1RLrAEQdgKZdnzyNa+QiSoPhAoBWq9pce9Eu9xjwwB0/BACBwwGIoiYnOA5HqxRGS7Zkk9aeuNr23PVms+Z2Joi2GZSKg5mIeKzPt2SLbgAKBc7pg8m5aO4TEC3V/R4eGIOA2eX6uvDUfQPAwcStAghzz9hXPnq/nTc4YdPFIoGZ0k1uAB+QZTbca4NCe3dBBC0pISxArkW1KRf3GLBoF1+9VwDcuV5te5rSjSITEcQy8mxeFeVcsmdXK3btq99uds41jCbtpz6AHpSoa6lwmRrFZAR9/jMEAIFadUYnOctgGH8rxWkiIjCavOwhkJFAsou2LTzykJ34/AfsnFqXidQxmhqxQDR9YA0stQy3Xi6n0llW6FkixQCPwbhPAHAtTBAAQiJJ8WMAUK2OPS/0KZDOvcpe8Krf4Tq0XxDtxYNLVYvEiYwo95YuxJDy7CAo5YXBNxSodEylkT6iMfqKZdWxBGcP7kLJwhTp1p61H3zwD62+/CyEaIqwQ9QRwhCqACCIl7Q/QAYxAtfND/GAAqo/v9K2ywXA6fsPuARRz0T97VbgFqA5Vm2VwU+vDeyaV/2q2QtvAsGzma1aYRpdXzSsEhpky6CnQSVgTSbsaU+DRqcmbgoQBJgywYgUirf6MzX5CmAqakdfgSDZ7eIhkJ8vfNgOfvkTNnXGGdYnPYucKXJUoeQRWpX+1gH4XzUKLjByHtAMAPYSA04/cHvwAC9OYHv4S5hx9NYkwwpusNbYabtf9xtmmy5kLpswFvl/zGXkVaGKEgSFB2ekq0yOPFQdn3p6PjWHNObvFFXycg0+KU234fq57uPBquX0w0mj+L/AxA3s+Nfsax/+E9u6qeHlcxVfE3XIyRpB4iKFy5pkif4cgM5VKzCZcIGmLQLApXuv/78BqJBShGQl79tMp2ITF91qu176S0SorRQhEzw8zF9ssQJJKbXsnbqC6L10xOz0iehTJiEEaN9xjn6efNMLHmhvBnW27RcxJK045CbsYBnQW8DpIHyDWiNTWlw+bN/7u/uIi8/aJl3Xzz3KqyXmXYZUWQ5UQapLpUrQoxydIYmsFCsLWO4EFZ7BBdxclbeYTA025uWDqjNRyVrPnlkY2Hk3/LJtffFd4NvEKifjoQJbTNYDIP+jmVoXkzn+HXv84Qds5ejXoc6TSfMDAuHQOilwTlDKeeVGxdgGlelNF9tVr/kts103WgHRco/kP+o7dak/poj2Rjay7pyd+JcPWf/gl2xzpQe2kQVkfYWUIYtR4YWFjlCiAvVQBA++UOH56iBluNvcCgDsVTX45weoBv83AEI/AOiTM5cBILOLX/K7Nn31S22ItopKM/K0zF9aVZSVNiQuvP7Yl/7BTnzpHrtyF5pdC20XdGQGRP4O+VtCTpDiFOkFfJFvsTme0XzhzXb2a9/G+LiYgioTgvl7NFLH0EZYFj2+5z/zNzb6/kO2lZigFpfkVykeHSNZgdyPO7CCIc0PxRoRpgq5cETAlMUtLHdtt4jQwn13FmXakMZrai05AEKPOr3RtsMId+4tb7Ut17/Sy8wRfu0uwHXeTSszmwIRZvvUQx+y7NDf2/baPF1bsgUCDQWANEp1J0BaaFVWNKTWGGKS7S7jbnuR7XzD3SB5BuZPPEBQhTZZJOVAcrMVe/rT77XsyU/ZmTVcIptggg3GxgIJnB7DYKUt1jXUzBqgrBHpcjBqM3G13kWlczu9PLC919ISEwBCULWzCoiNAKibWqkv2qHFiu289W4787qf8/6b2mAecFKt7UEHRqe8LycbPfOIfeFv32Y7Jzk2nPCgKh3oOT1Vh8SAplJYosDSyPNzK3bzXWSZa1+KGjf5ZMXasgSYu0RPbAbq+/z37N/f97s+fhUA+r0+k6tYg/Q2XSsYGxng+pMT07YGJVQ3uC/KrJgIQKpVZpd6tkc9wcX3YAEqMz0LiM2jGbeABrU4gaM+Z4ewgJ23/YGduf9VCsmeloKkRDobdNVNToyOis3qIH3o63bymSeCo7ujiAiVZaoqOJ+SxwCKbNtx/iXWuPgqRMBiamivR+XXiFSsAksBTW7m3ej+sq0d/Y7NHWb8fpt+H0yDSa8snLLFo0/YGXnHtpIahn3MXQUa50XpK6lDNSLjzCz37cpraYkJAFHGnkJkAkC/cgDIiJz1+ow9PZ/Zrtt+387Y/3OR1pQbU7pxEDweKIjGpAzh3XH7oK7gpU9Z/6c/x2lQPGHAtzYNB1LBEt1c/4gseVQXcFExYtApvaKAHkFRonj7nS9N3cWvf86e/sZnbUd9jQyBi5A9FB9kThJPyhUAs2SBy/bdRFv8PbfjAtICOVJtbFVhfCqjlltAszqDCxCcb7vbzrgeAEaUva4KtSQ1/XJGaBi/rVCjS189zFItrkAnsTqPG7JDb+/EuYJmCMXJwAlPYoACBL9VfNGynB4hC1hDoxPyM1HmNSrCBhnGa+iSLXJt+4Q9/pF7rTr/tJ09SYuu2+FRyKSiSNJ6u74KAF27aB8WEADoAQpuyiEI5M7SIpr2rFk7bUfnB7bzJXfblv2vYS6UvmqKiG6q7lKDQSyQMlj92BEPUtWlFuUAQVtOK0OLPq4i5gb6LAPqMbFKnc6TOrvqStNbGKnCk1H5ugLmjIVGGxY7cKKmWCJNKcOkjAzoVsza8U89aKukyemKcj/3Kb55r6EEILdTK6t26b6fhAfcd5u39cMCxOMDgGw06exqogIAi70EwKt5EvV/YqixIujSUMWp3IzFzD55MaMTIh3L5GLZShGYnqG07xQzxQV1mCWcE0ZnTfF/zFRNIpb2woIYrANQDZq07nFif258A+uTUqt0ojJ1lPozdupTf23tp75AO4254K6ygBFp0dvjUhJZYIaW2GXX3QAAf3Yzs05tZAFBulLxIAuoEnBa+awdXejZube/xaavuwtZACBR+liM1kSieaogI3bnObwU0v2ENUd8XaVJjfTqkaIiiqMSmZ6epi1L9zJhwMRlUbG05TWTxmOZTst10fz2bqOPM6JZ425HJM+414Yzdvyf3me9w1+xM5tDV4xodp85CXzvGyLnSWLAnn1Q4bn7bsLwVKFRX8usKwQuaY5oTFML95y1I3Mdu+j2t9qUskAx7ajKajwhuIaj1PUlb6RzAHROrpxmUYiF8ZfzB03Y9wIo3mjWgDI+HuOpxeUfZSg5qLg8scfXdwCo5h3SFE58QAVHguJwwU588oO29vh/2lkTrPzrbgKryI6ciNUF5M7t5NLA9lyLBQgA12MBxUXwAX7jzyUIygVq1bkfAoDAQ4DyebuP6t8wbyWSsh+g6YkVx/myz4hbqIiKBzCGrtIwKTDK9H3eKssDgCjUxPCErFcy7vSZa6C8XqcUaAFgtGQ/IAb0vv9F29Ya2IroPAAM0Y6ilKpGrS/MAMDl1wDA/L0vJlSplybKqIepglMrSaaJzwHAwTki5oHfs2m3AIKg6GXSjoD35TH+HlIV5iAga+irV8944SJlP0ABsAQgcBh/wpPCrmXKfFQtqMZTs16/CrFDFUWy2OQavpLuF8sC1F4HgE8CwGOfA4CRrYp9cM8QF6kgm9xaAMzCAy7bCIDyrI8jANS8wl/00Hptzp6eHdgFB94GFQYAeR/XKmtE01NZSX6GFag8TVRAwvehxapuxxygTINeEkc6G380AQ+OCay0Cu0dIg9eca2XszJmBTalyTGv0ElZwIod/eT7rf/Yw3Y2FtDhIi2Gask/tlIIgIanwcucCr/7FtxD/quND1FXe5hxADoAMGuH5zJ7wZ1vhwe80q/waOXQx2ydt3szBBcSK0zBzCeua1z2NFm/Rf+R5OscIlS6ftn4vINE2sWEM/qOuiVY3Tp2UW4LAFnAih35xIM2fOzfAIBizqkwXxclMlNYAABcQxAsAegnC/BaIAU1EaFGPm9PLZi94MAf2Vk3JABK7an1JcuTb4lmlhNQP2DmSSvmT1m/k8w5MUEvnfmWVDgmSqXg6+gyUTE2tbgFKFtgmgTIXRez12UXf2P60S/xe0S8crFSx1jrm1jvcBkAPmC9x//VzmmybCee7+1wjRvAhwWsBQBzf3qLLyx3MRN9WphtCYAREOvVeTs4n9suANh2w6tS+zxNVhE5paWh7yIhHzOR3uFv0g+431af/ZZN1c9MmtYaosruWLJupA0RmpEqua5bkBZf0n4kgrIetsJa4Nm7b7KLX/HbLLmdzxhRT2jizoIdWEiXjsm8B7KA948BGNBrED/x5qkosdYTBYB4wLVaGAEAuUBpAT8CQN5OFvD2AMD9t9S2Lz2kfmLqB9AUOfKFj9mpr95nV2xHY3STtLFB21ykDJXD0vQEaa0eDu11SNsZndb5YYKoOGfznq9NoJfvnBjY9a+7xxpX3Oq0OVo2mrY6vuGGrMt6PyKjeXuEGNB94t/snIYKolgPULVaeI+RsMzy2uzKsl2hdYGZe28GALBLnZqWL0sTyd1ZOtaqd+2Jmb7tuv33bPuNr0FIPSb37XOafdnakxBugvQDn/jX95s9/VHb0aAf0FdHSAKrI1SAB0UWE5yC5mlTg682cXxNOZ69fk38WCQxh3B574HNTY8e69COv8c27b2DaiiKoi60d4Jaw/cdoFk1bicUQLvErE/8la0d/LztlBGBjFyq58EP61OnCMAFgBOh/x8AUcyOHSILnHvzm23bzT8PAFBRb1tHRB7SBK3VFZEFnHg6tPcHj9rnP0T/oLpk+YCy2gsdAhKg9RBCbLGh4iT19HW8C7FR66rOAkn08ekNcnypt2Kbz9tvV7z6rcaSVJhxioCedSSJ7keehojQaN6O/uMDtnzwi7ZjgkDOPkIHQI1bMcYEwAwAXCkATmEBSjVqTclUpRV1amKTAbyLQHh6rWFbrnyl7bjtDb4ipI6Q5PAPwjpNVUWm6OQlMKzv0CM2d/yINwxTsgyi5ePGIrAbmS/Gqlka7qDnBxWHtsivSSlbz7/UjDUJNi9GJ9UTjmrOIFGq51XRVo3yd+GwPfWR91i+dJSmqXa4iTdooVaERfsZxFKrXgs4AM85ERK1VYAAgLS3R48oq8NVKsDepsvs0texJDb5QgbCCrTc5N1gXZgKgISJgyAhvS+gklgUL50c5+3UR/MoopMlEyqBTanN6aZ+i/xo8vpbt8h9dK2iuixQW3EA4AffsEc/cI/tPINOVGdJ5ZdbgFJnyVvUIJkhCyQAbk1ZWhag9BMg+/KYuqw8e40cfLpTt2vf+Bazs9kE0VRkFzVVKSz5YlZD+ny59uQiWbevfoD2EJYLIyFsBI00eZ+IIxj/ejmuAUswlL/Dx3M3OV2UFs28+EqVpTdEAJ1K0B79lH2bhdSdZ22DFhBPtL9IsUSteCdUykbsbWiv2lXqCD13761UqjKNUiMxGXVXfZ+ANibw9xxbYHZdcYdt/pnf5Bjrgr4lzK/0xZAK0VkTGVKSKkURPVxRsegdixXRD0hU2O2/nLzYTbpEruCdoDiv5VPqQ2pGHYj9CVXiyLgR44dlcdzTe94OP3i3NRaPwkjZT5S2xCgNqtvktQnRYogYJ1e6BEEAOPmnsTyuHZj6RG9wHQCRnApFudjeye6U7X3TH2MF+CT+5ebh+ScVUtynTpgaOiVhoUfpwAjMcT+AI9rLE8DI3JhQer6KQPUONB8FAe2F7qdqJRdjTSnQ+wxBAbwVrzJ08NgX7Vt/9we2+8w6WQJrptssuWUFJQAkXNKgtsz2oyn6/LvDBUoANGLs5A6htbSpJzWIjCfX2KVxyQG7WGuE8kn/ysfRUvJPX5jgloTBuJ7XhH15PE3A29NeIOuTymFh4a4vk05uJRx0TDGMf1WpyFOCtmkIKQILaJ+0Lz/4Dju/f8imhkvIoz0t0QSRBWSi0lqLpNMtFzjNnuEXyQJOvytaYuXHt5kk05QmtP4/pE1V16IC7evDCyB3x+tt+ga1x9QcAQSxSEX3DbHQd2NpDm7K6wHOiVTSfalCZ3RjCcquUFBhfbzWUozeIKf/JPv4jYM5Ow73eP77n7cLpsgItMRrre1uiYW6ROIA4jauStUUVZtfmLPL92MBJQA+WUc3dFLuE1KzRGSjhU0O2LExajTtqZk12/fyN1vrGoiJqUUGAL7kHRKWzWEX3A9sjPBpr/E65tFDKOPBxm5zWTBxXr3PQrWCb16WhegAALDg8dxnP2bHvvpxu2gbbTH2NKoF1hniluIr6jypT8m4vmrM2mOFQL2wMGuX72NtsHSBUjPrAISEhYokllia3Kp+TJcH2tQWOzi7Zlff+Ys2cT2WkGkhw+veUFNZqpU+umGyP/KzjKUOVAlW2qHm2k/NUdc4XwVJNUfUEh8u2sn/+LA988hn7dKzJtH8ki+iyvS1hNfRSpFvlROf0Z5wYgorRtpYMTc/a3vUEzz1J7fGXudyS6nQTqamRYW+Ki6Oab8evsA06bPhzz06t3KHbVf+rF3yEz9NYNwZzup9fbSsZXKsJRXwad4CSD+TRWxMiTqcyJDvpE0yuHVog7PyvxqH2jekf585aI//10PWffYb9gLYdkZam2pNW5tub9Zkyz9m6Iui2n2uFg3Pih3qkDhtkJhbsBft1/L4PS8Z6yAssUxZao+p1RW1d5NIPVijPKYrq3X2ZVZnKo0Jm9d6ZXXSzt291zZfeSN09VzQgiewZOUbqMptNN7w0NiiywJCa3QCXoE06Kz7fCpZyzI53jdQmYvlLbHcfvqwzX73K3bsyUesRe2xY/M0rUDkQrPa0pc3J1zzq9p+Cw+ppC234jhStCs3AXD5fvUE3/mSDUEwvZ4C7L7nXtbczNkrvOR5taneWi82RDdaivxi4P46g80t92ytMmmTOy62ie3n+VZZa27yXZne09NeHd/JEW8NlOv4fW3A9MxT7u8oN1RQ7go0/HewOs9q2Ck2kh6xVXaKTeSrtm2yQWFYYfdaxyZ492fEJg7fw1yvwvshOwoVTF4rxbFkHlalV220WLqwsMAGTwXBe+gH6GKxQBestNbYDL0G8g02Sne09s+6fZ/lbn9ro0GBQaGiLS41oqoYW5/vkKd02YvfXsMUlYJ8lHWrcuLkx7QYq19ilMEWx9zKz6u2SDvL+auJ5U3yNksN66tpgRZw+rBNyTTQ7nTMtMs2GhUyDVyvvbhgU5PT1GDB/1Vqx9qkFiHYJbawjAtgASffFQ0RX1P3JBE79XItgUl8ImaPDcwjdoqIyNRhgb5YqQoi9e/0NodPyberxstUdZCs6rxM0DtMqi3CD31Xj2+d0Qqx9vf6hpZYli/BcnlkZSiGNDtiPUG7PsTrIyMAJXHJ1zV9NQqwGVLvCIn3tyBBBSW3tsZJVoGtd5rk1rLKuYUl27NfVPhdsU1OFuAT0YqwYhn78PQ+kAhE1PJdrw30IkL5kRmvU2gNEpr2N0YYTQ3IcV3B8XL/oe9CTUGunLS/bpOsJTSmmiJeyfO9XooVfkWkad9prsOCsVSE3MtpfWzH03w0bk7qVDXou0S14Z/V51ks4Mp9soB3v6xQ8JDZ9EGvWiPCU8XV6xMEPUwMFu6xCgalj7pHIUS84OaWk7oiJYFKpDoYXeLwutdL7FR5htWVBEiCKzYKtNIHA6Foua2TonEhNVaDNnaGK3nK5CuZgltoO8zQlteWbWJ6GkuWhXAe6r7CLvfde66EB7yD9wWQvFWbZEmKre80FasEvoHayNTiFd3ggqr+jpcQxilzLMSP+xF+XRKsMg7oBQa3pA2vzIT/R7zIQal8R1GjxubnBIRjUjbIY4Ie+ZLlSS4xWV0TViT2qgKqR8GGS7I3qE4pv8pe4xVewrhsv/YI3f+KosPLD5UOW9Knprm4w1sfrJ6w4aHDZocGPlT23VygHwFgvdLbGOrGQo2tIEBSWi0nHyrWglXkaQc6EQBpsuQD5bgbqfA4TZbvIY55TNlwkKyYPYVSg3cbVHupipS16/W5Z+lYexosPvuW4ntf+7LtZDvJkIe5y1oAAAHYSURBVFdiJkhfy7SLhuTQZouXInhHILlrMsl1bTtxS1trylhQVpOlxje+EFXeqQozmKe2uMlsQ7Plp/Rrt2KCRLz4oOAa3SUF2dq4WNLu8LBK+bx3icfb/UNhngphsyOKA70C1KO6PTIzaz/1K7/G9c89VHzjw+9n/23HmnrLUktIINUlqg4oJJQVNga7skYYC5t4vjQWMaCcSBkQIwUp2EU0lpYj7wcAP2byvkyvmFGmyfg3doFpXTD2/+qjFyTHAHjwVSCPN0U825A5mqS9XLQYAjSEAxxb5B2o86+y3W/8ZTVyF4ri6Pfs6x+/1+qrx2zX5q3UGH16dBQS3FBop3gyUUc5oesaT/m7nFSItK5Jt4K0/DXmF+masVlvWB7D2RKu6a1R/0tBTsPEHdGxir2BZfco9jfEfiLvMTrblKx6aYpMJkUyD23nO90b2fQF19nuV9DYOfNcpWGNtMRKzlfNvvuwzR98ksTaJYGxXK5FEi2UqrwgrXii0kovD4pl7vRmhpt0yeDCB8tV4pL2lH+PS1zxQWnKqzSNH7X7OK2mzBKT1y7y0qLiJcrIH3oJkkaLb5imZ8QhMU2Xy9eClaG0jskaZZ1cMtG06Uv3xU60yT0gOWn/A97Z1RhsUvZnAAAAAElFTkSuQmCC",
                "backgroundColor": "white",
                "uriTemplate": "https://www.blogger.com/blog-this.g?n={uriText}&b={selectionHtml}&eurl={uri}",
                "usageCount": 0.1
            }));

            // http://business.pinterest.com/en/widget-builder#do_pin_it_button
            list.push(new Activity({ "type": "document", "id": 0, "name": "Pinterest", "description": "Pin", "imageUri": "https://s-passets-ec.pinimg.com/webapp/style/app/desktop/images/logo_trans_144x144.4d67817d.png", "backgroundColor": "white", "uriTemplate": "http://www.pinterest.com/pin/create/button/?url={uri}&description={uriText}&media={selectionImageUri}", "usageCount": 0.2 }));

            // http://vk.com/dev/Share
            list.push(new Activity({ "type": "document", "id": 11, "name": "VK", "description": "Share Link", "imageUri": "http://vk.com/images/share_32_eng.png", "backgroundColor": "white", "uriTemplate": "http://vk.com/share.php?url={uri}", "usageCount": 0.2 }))

            list.push(new Activity({ "type": "document", "id": 14, "name": "LiveJournal", "description": "Post an Entry", "imageUri": "http://l-stat.livejournal.net/img/apple-touch-icon.png?v=6037", "backgroundColor": "white", "uriTemplate": "http://www.livejournal.com/update.bml?url={uri}&subject={uriText}", "usageCount": 0.2 }));

            list.push(new Activity({ "type": "document", "id": 0, "name": "Digg", "description": "Submit a link", "imageUri": "http://digg.com/static/images/windows-tile-144x144.png", "backgroundColor": "white", "uriTemplate": "http://digg.com/submit?url={uri}", "usageCount": 0.2 }));

            // https://delicious.com/tools
            // https://delicious.com/branding
            list.push(new Activity({ "type": "document", "id": 13, "name": "Delicious", "description": "Save link", "imageUri": "https://delicious.com/img/logo.png", "backgroundColor": "white", "uriTemplate": "https://delicious.com/save?v=5&provider=cloudshare&noui&jump=close&url={uri}&title={uriText}", "usageCount": 2 }));

            // https://developer.linkedin.com/documents/share-linkedin
            list.push(new Activity({ "type": "document", "id": 14, "name": "LinkedIn", "description": "Share link", "imageUri": "http://s.c.lnkd.licdn.com/scds/common/u/images/logos/linkedin/logo-in-win8-tile-144_v1.png", "backgroundColor": "#0077B5", "uriTemplate": "http://www.linkedin.com/shareArticle?mini=true&url={uri}&title={uriText}&summary={selectionText}", "usageCount": 1 }));

            // https://developers.google.com/chart/infographics/docs/qr_codes
            list.push(new Activity({
                type: Activity.types.document,
                name: "Google",
                description: "Show QR code",
                uriTemplate: "http://chart.apis.google.com/chart?chs=320x240&cht=qr&chl={uri}&choe=UTF-8",
                imageUri: "https://developers.google.com/_static/8b217e58ab/images/apple-touch-icon.png",
                backgroundColor: "",
                usageCount: 0
            }));

            // http://support.addthis.com/customer/portal/articles/381265-addthis-sharing-endpoints#.U3RK3fldX7E
            list.push(new Activity({
                type: Activity.types.document,
                name: "AddThis",
                description: "Share link",
                uriTemplate: "http://api.addthis.com/oexchange/0.8/offer?url={uri}&title={uriText}&description={selectionText}",
                imageUri: "http://cache.addthiscdn.com/www/140514127880/images/addthis_57x57.png",
                backgroundColor: "",
                usageCount: .1
            }));

            // https://getsatisfaction.com/feedly/topics/subscribe_to_something_in_feedly_using_the_chrome_rss_subscription_extension
            // http://www.feedly.com/factory.html
            /*
            list.push(new Activity({
                type: Activity.types.document,
                name: "Feedly",
                description: "Subscribe to feed",
                uriTemplate: "http://cloud.feedly.com/#subscription/feed/%s",
                imageUri: "http://s3.feedly.com/img/feedly-512.png",
                backgroundColor: "white"
            }));
            */
        },
        clearList = function (list) {
            list.splice(0, list.length);
        };
    this.initializeAsync = function () {
        return that.loadAsync();
    };
    this.saveAsync = function () {
        return diskSerializer.startLastAsync(function () {
            return saveRawAsync();
        });
    };
    this.loadAsync = function () {
        return diskSerializer.startLastAsync(function () {
            return loadRawAsync();
        });
    };
    this.resetAsync = function () {
        clearList(list);
        addDefaults(list);
        list.notifyReload();
        return that.saveAsync();
    };
    this.getItems = function () {
        return list;
    };
    this.getItemById = function (id) {
        return list.filter(function (item) {
            return item.id === id;
        })[0];
    };
    this.getItemByUriTemplate = function (uriTemplate) {
        var matches = list.filter(function (item) {
            return item.uriTemplate === uriTemplate;
        });
        return matches.length > 0 && matches[0];
    };
    this.removeItemById = function (id) {
        var idx = list.indexOf(that.getItemById(id));
        list.splice(idx, 1);
        saveInTheBackground();
    };
    this.addItem = function () {
        var activityIdx = list.push(new Activity({
            type: Activity.types.document,
            name: "Example",
            description: "Post",
            uriTemplate: "about:blank?link={uri}&name={uriText}&description={selectionText}",
            imageUri: "http://example.com/favicon.ico",
            backgroundColor: "white",
            usageCount: 0
        }));
        saveInTheBackground();
        return list.getAt(activityIdx - 1).id;
    };
    this.noteItemUsage = function (id) {
        var item = that.getItemById(id),
            idx = list.indexOf(item);

        item.usageCount++;

        list.splice(idx, 1);
        list.splice(0, 0, item);

        list.notifyReload();
        // saveInTheBackground();
    };
    this.noteItemUpdate = function (id) {
        list.notifyReload();
        saveInTheBackground();
    };
    this.setSelectedId = function (id) {
        selectedId = id;
    };
    this.getSelectedId = function () {
        return selectedId;
    };
};
