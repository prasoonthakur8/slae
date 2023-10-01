// Background script for Chrome Extension (Manifest V3)
let isUpdatingCO2 = false; // Lock to prevent API race conditions

// Fired when the extension is first installed, when the extension is updated to a new version, and when Chrome is updated to a new version.
chrome.runtime.onInstalled.addListener(() => {
    console.log('Background script running');
    // Rest of your code
});



// Background Script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'switchOffDataweight') {
        // Block web requests for the trackingTabId
        chrome.webRequest.onBeforeRequest.addListener(
            function (details) {
                if (details.tabId === trackingTabId) {
                    return {
                        cancel: true
                    };
                }
            }, {
                urls: ["<all_urls>"]
            },
            ["blocking"]
        );
        if (co2UpdateInterval) {
            clearInterval(co2UpdateInterval);
            co2UpdateInterval = null;
        }
    } else if (message.type === 'switchOffDuration') {
        // Clear the interval
        if (co2UpdateInterval) {
            clearInterval(co2UpdateInterval);
            co2UpdateInterval = null;
        }
    }
});



// Function to inject the content script
function injectContentScript(tabId) {
    chrome.scripting.executeScript({
        target: {
            tabId: tabId
        },
        function: contentScript
    });
}

// The actual content script logic
function contentScript() {
    document.addEventListener('click', () => {
        chrome.runtime.sendMessage({
            type: 'eventClick'
        });
    });

    document.addEventListener('scroll', () => {
        chrome.runtime.sendMessage({
            type: 'eventScroll'
        });
    });

    window.addEventListener('beforeunload', () => {
        chrome.runtime.sendMessage({
            type: 'eventNewPage'
        });
    });
}




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
        injectContentScript(message.tabId);

        co2UpdateInterval = setInterval(updateCO2Emissions, 1000);
    } else if (message.type === 'eventClick' || message.type === 'eventScroll' || message.type === 'eventNewPage') {
        // Update the totalDataWeight based on the type of the event
        totalDataWeight += getEventWeight(message.type);
    }
});

// Function to calculate weight based on event type
function getEventWeight(eventType) {
    switch (eventType) {
        case 'eventClick':
            return 5;
        case 'eventScroll':
            return 2;
        case 'eventNewPage':
            return 10;
        default:
            return 0;
    }
}

chrome.webRequest.onCompleted.addListener(
    function (details) {

        if (details.tabId === trackingTabId) {
            const requestDataWeight = details.responseHeaders.find(
                (header) => header.name.toLowerCase() === 'content-length'
            );
            // if (requestDataWeight) {
            //     totalDataWeight += parseInt(requestDataWeight.value, 10);
            // }

            if (requestDataWeight) {
                totalDataWeight += parseInt(requestDataWeight.value, 10) * 8; // Convert bytes to bits
            }
        }
    }, {
        urls: ['<all_urls>']
    },
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


const updateCO2Emissions = async () => {
    if (isUpdatingCO2) return;
    isUpdatingCO2 = true
    // Calculate duration
    const duration = (new Date().getTime() - startingTime) / 1000;

    chrome.runtime.sendMessage({
        type: "updateTotalDataWeight",
        totalDataWeight: totalDataWeight
    });

    chrome.runtime.sendMessage({
        type: "updateDuration",
        duration: duration
    });

    try {
        const response = await fetch('https://d2ivv4sencxt7i.cloudfront.net/api/get-carbon-emissions/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                duration,
                dataWeight: totalDataWeight
            })
        });
        const data = await response.json();

        // Log the total carbon emissions so far
        const totalEmissions = data.data * 1000;
        chrome.runtime.sendMessage({
            type: "updateCO2Emissions",
            totalEmissions: totalEmissions
        });

    } catch (error) {
        console.log('Error:', error);
    }

    isUpdatingCO2 = false
};