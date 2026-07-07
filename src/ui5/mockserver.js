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

            // --- MIGRATION BRIDGE: CONTINUOUS STREAMING ---
            // Keep a reference to native fetch, bypassing Sinon's XHR interceptor
            var nativeFetch = window.fetch; 
            var proxyEndpoint = "http://localhost:8081/admin/append-interaction";

            function streamToProxy(oEvent) {
                var oXhr = oEvent.getParameter("oXhr"); // Sinon's FakeXMLHttpRequest
                
                var interactionData = {
                    method: oXhr.method,
                    url: oXhr.url,
                    requestBody: oXhr.requestBody,
                    requestHeaders: oXhr.requestHeaders,
                    status: oXhr.status,
                    responseText: oXhr.responseText,
                    responseHeaders: oXhr.responseHeaders
                };

                // Fire and forget to the Node proxy
                nativeFetch(proxyEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(interactionData)
                }).catch(function(err) {
                    console.error("Proxy streaming failed", err);
                });
            }

            // Attach the streamer to all relevant HTTP methods
            var aMethods = ["GET", "POST", "PUT", "DELETE", "MERGE", "PATCH"];
            aMethods.forEach(function(sMethod) {
                oMockServer.attachAfter(MockServer.HTTPMETHOD[sMethod], streamToProxy);
            });
            // ----------------------------------------------

            oMockServer.start();
        }
    };
});
