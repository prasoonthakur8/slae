// Background script for Chrome Extension (Manifest V3)

// Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version.
chrome.runtime.onInstalled.addListener(() => {
    console.log('Background script running');
    // Rest of your code
});



let trackingTabId = null;
let totalDataWeight = 0;
let startingTime = null;
let co2UpdateInterval = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "startTracking") {
        // Stop any existing intervals
        if (co2UpdateInterval) {
            clearInterval(co2UpdateInterval);
        }

        // Reset previous tracking
        totalDataWeight = 0;
        startingTime = new Date().getTime();

        // Set the tab ID for tracking
        trackingTabId = message.tabId;

        // Start a new interval for this tracking session
        co2UpdateInterval = setInterval(updateCO2Emissions, 1000);
    }
});

chrome.webRequest.onCompleted.addListener(
    function (details) {
        // If the request is from the tab we're tracking
        if (details.tabId === trackingTabId) {
            const requestDataWeight = details.responseHeaders.find(
                (header) => header.name.toLowerCase() === 'content-length'
            );
            if (requestDataWeight) {
                totalDataWeight += parseInt(requestDataWeight.value, 10);
            }
        }
    },
    { urls: ['<all_urls>'] },
    ['responseHeaders']
);

// Listen for tab removal event to stop tracking
chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (tabId === trackingTabId) {
        // Stop tracking and clear interval
        clearInterval(co2UpdateInterval);
        co2UpdateInterval = null;
        trackingTabId = null;
    }
});


// Function to update CO2 emissions
const updateCO2Emissions = async () => {
    // Calculate duration
    const duration = (new Date().getTime() - startingTime) / 1000;

    try {
        const response = await fetch('https://d2ivv4sencxt7i.cloudfront.net/api/get-carbon-emissions/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ duration, dataWeight: totalDataWeight })
        });
        const data = await response.json();
        console.log('Success:', data.data * 1000);
    } catch (error) {
        console.log('Error:', error);
    }
};

// Update CO2 emissions every 10 seconds (you can adjust this interval)
// setInterval(updateCO2Emissions, 10000);

