import axios from 'axios';

export const config = {
    // ... other configs ...

    beforeTest: async function (test) {
        const testName = test.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        // Tell the proxy to open a new memory buffer for this test
        await axios.post('http://localhost:8081/admin/start-recording', { 
            testName: testName 
        });
    },

    afterTest: async function (test, context, { error }) {
        // If the test failed, optionally pass a flag to discard the buffer
        if (error) {
            // Optional: You could add an endpoint to discard failed test data
            console.log(`Test ${test.title} failed, cassette may contain errors.`);
        }

        // Tell the proxy to flush the buffer to disk and close the file
        await axios.post('http://localhost:8081/admin/stop-recording');
    }
};
