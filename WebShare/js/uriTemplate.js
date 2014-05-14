var UriTemplate = (function () {
    var UriTemplate = {},
        objectToPropertiesArray = function (object) {
            var name,
                properties = [];
            for (name in object) {
                if (object.hasOwnProperty(name)) {
                    properties.push({
                        name: name,
                        value: object[name]
                    });
                }
            }
            return properties;
        },
        applyPropertiesArray = function (properties, object) {
            return properties.reduce(function (object, property) {
                object[property.name] = property.value;
                return object;
            }, object || {});
        },
        replaceAndEncode = function (template, map) {
            return objectToPropertiesArray(map).filter(function (entry) {
                return typeof entry.value === "string";
            }).reduce(function (template, entry) {
                return template.replace(entry.name, encodeURIComponent(entry.value));
            }, template);
        },
        removeAllVariables = function (template) {
            var variableMatcher = /{[^}]*}/g;
            return template.replace(variableMatcher, "");
        };

    UriTemplate.printfTemplateToUri = function (uriTemplate, content) {
        return replaceAndEncode(uriTemplate, { "%s": content });
    };

    UriTemplate.uriTemplateToUri = function (uriTemplate, contentMap) {
        var formattedMap = applyPropertiesArray(objectToPropertiesArray(contentMap).map(function (property) {
            return {
                name: "{" + property.name + "}",
                value: property.value
            };
        }));
        return removeAllVariables(replaceAndEncode(uriTemplate, formattedMap));
    };

    return UriTemplate;
}());