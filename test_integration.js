const { spawn } = require('child_process');
const http = require('http');

// A simple script that waits for health check to pass by polling.
const MAX_ATTEMPTS = 20;
let attempts = 0;

function checkHealth() {
    http.get('http://localhost:3000/api/health', (res) => {
        if (res.statusCode === 200) {
            console.log('Health check passed');
            process.exit(0);
        } else {
            retry();
        }
    }).on('error', (err) => {
        retry();
    });
}

function retry() {
    attempts++;
    if (attempts >= MAX_ATTEMPTS) {
        console.error('Max attempts reached. Backend is not healthy.');
        process.exit(1);
    }
    setTimeout(checkHealth, 1000);
}

checkHealth();
