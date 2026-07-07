import express from 'express';
import { StorageManager } from './StorageManager';
import { MatcherEngine } from './MatcherEngine';

const router = express.Router();
const matcher = new MatcherEngine();

// Stateful buffer for the currently running test
let activeCassetteName: string | null = null;
let activeInteractions: any[] = [];

// 1. WDIO calls this BEFORE the test starts
router.post('/admin/start-recording', (req, res) => {
    activeCassetteName = req.body.testName;
    activeInteractions = []; // Clear buffer for new test
    res.sendStatus(200);
});

// 2. UI5 calls this CONTINUOUSLY during the test
router.post('/admin/append-interaction', (req, res) => {
    if (!activeCassetteName) {
        return res.status(400).send('No active test recording');
    }

    const interaction = req.body;
    
    // Format and hash exactly like before
    const formatted = {
        hash: matcher.generateHash(interaction.method, interaction.url, {}, interaction.requestBody),
        request: {
            method: interaction.method,
            url: interaction.url,
            body: interaction.requestBody,
            headers: interaction.requestHeaders
        },
        response: {
            statusCode: interaction.status,
            body: interaction.responseText,
            headers: interaction.responseHeaders
        }
    };

    activeInteractions.push(formatted);
    res.sendStatus(200);
});

// 3. WDIO calls this AFTER the test ends
router.post('/admin/stop-recording', (req, res) => {
    if (activeCassetteName && activeInteractions.length > 0) {
        StorageManager.saveCassette(activeCassetteName, activeInteractions);
    }
    activeCassetteName = null;
    activeInteractions = [];
    res.sendStatus(200);
});

export default router;
