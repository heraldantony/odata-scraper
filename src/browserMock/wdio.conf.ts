import axios from 'axios';

// A global array to keep track of any mocks created during a single test
let activeMocks: any[] = [];

export const config = {
    // ... your other WebdriverIO configurations ...

    /**
     * BEFORE HOOK: 
     * Monkey-patch the browser.mock command so we can automatically 
     * keep track of every mock instance created by your test files.
     */
    before: function (capabilities, specs) {
        const originalMock = browser.mock.bind(browser);
        
        browser.mock = async function (...args: any[]) {
            const mockInstance = await originalMock(...args);
            activeMocks.push(mockInstance);
            return mockInstance;
        };
    },

    /**
     * BEFORE TEST:
     * Tell the proxy to open a new memory buffer for this test.
     */
    beforeTest: async function (test) {
        activeMocks = []; // Reset the tracker for the new test
        const testName = test.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        try {
            await axios.post('http://localhost:8081/admin/start-recording', { 
                testName: testName 
            });
        } catch (err) {
            console.error(`Failed to start recording for ${testName}:`, err.message);
        }
    },

    /**
     * AFTER TEST:
     * Loop through all recorded mocks, extract their network calls, 
     * and send them to the proxy before closing the recording.
     */
    afterTest: async function (test, context, { error }) {
        // Only extract data if the test passed successfully
        if (!error && activeMocks.length > 0) {
            
            for (const mock of activeMocks) {
                // mock.calls contains every request intercepted by this specific mock
                for (const call of mock.calls) {
                    
                    // Format WDIO's mock data into the format your Node Proxy expects
                    const interactionData = {
                        method: call.method,
                        url: call.url,
                        requestBody: call.postData || '',
                        requestHeaders: call.headers || {},
                        status: call.statusCode,
                        // WDIO might store mocked bodies as JSON objects, so we stringify them
                        responseText: typeof call.body === 'string' ? call.body : JSON.stringify(call.body || {}),
                        responseHeaders: call.responseHeaders || {}
                    };

                    try {
                        // Send the interaction to the proxy buffer
                        await axios.post('http://localhost:8081/admin/append-interaction', interactionData);
                    } catch (err) {
                        console.error('Failed to stream interaction to proxy:', err.message);
                    }
                }
            }
        }

        try {
            // Tell the proxy to flush the buffer to disk and close the file
            await axios.post('http://localhost:8081/admin/stop-recording');
        } catch (err) {
            console.error('Failed to stop recording:', err.message);
        }
        
        // Clear the tracked mocks for the next test
        activeMocks = [];
    }
};
