sap.ui.define([
    "sap/ui/core/util/MockServer"
], function (MockServer) {
    "use strict";

    return {
        init: function () {
            var oMockServer = new MockServer({
                rootUri: "/my/odata/service/"
            });

            oMockServer.simulate("localService/metadata.xml", { sMockdataBaseUrl: "localService/mockdata" });
            
            // 1. Start the mock server (This replaces window.XMLHttpRequest with Sinon)
            oMockServer.start();

            // --- MIGRATION BRIDGE: CONTINUOUS STREAMING V2 ---
            var nativeFetch = window.fetch; 
            var proxyEndpoint = "http://localhost:8081/admin/append-interaction";

            // Grab Sinon's FakeXMLHttpRequest prototype
            var originalOpen = window.XMLHttpRequest.prototype.open;

            // Monkey-patch it to listen to every fake request
            window.XMLHttpRequest.prototype.open = function (method, url) {
                var xhr = this;

                // Listen for the exact moment the Sinon Fake XHR fully completes
                xhr.addEventListener("readystatechange", function () {
                    if (xhr.readyState === 4) { // 4 == DONE
                        
                        // Ignore internal MockServer setup files like metadata.xml
                        if (url.indexOf("localService") !== -1 || url.indexOf(".xml") !== -1 || url.indexOf(".json") !== -1) {
                            return;
                        }

                        var interactionData = {
                            method: method,
                            url: url,
                            requestBody: xhr.requestBody || "",
                            requestHeaders: xhr.requestHeaders || {},
                            status: xhr.status,
                            responseText: xhr.responseText || "",
                            responseHeaders: xhr.responseHeaders || {}
                        };

                        nativeFetch(proxyEndpoint, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(interactionData)
                        }).catch(function(err) {
                            console.error("Proxy streaming failed", err);
                        });
                    }
                });

                // Continue with the normal Sinon open process
                return originalOpen.apply(this, arguments);
            };
            // -------------------------------------------------
        }
    };
});
