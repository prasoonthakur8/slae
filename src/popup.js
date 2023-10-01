import $ from 'jquery';
import './styles.css';

import 'jquery-ui/ui/widgets/slider';

$(document).ready(function () {
  $('#sayHiButton').click(function () {
    alert('Hello');
  });
});


var currentStart = 0;
var chunkSize = 12;
var offers = [];


function displayOffers(start, end) {
  var html = '';
  for (var i = start; i < end && i < offers.length; i++) {
    var imageUrl = offers[i].image;
    if (!imageUrl) {
      imageUrl = 'images/offer_earth.png';
    }

    var imageElement = imageUrl ? `<img class="w-full h-32 object-cover mb-4" src="${imageUrl}" alt="${offers[i].title}">` : 'Store';

    html += `<div class="product-card w-[42%] md:w-[42%] mb-4">
              <div class="rounded-lg p-1">
                ${imageElement}
                <div class="product-info flex justify-between items-center mt-2">
                  <a class="visit-link text-blue-500" href="${offers[i].merchant_homepage}" target="_blank">Visit</a>
                  <button class="favorite-icon text-orange-500">&#9733;</button>
                </div>
                <div class="product-title">${offers[i].title}</div>
              </div>
            </div>`;
  }
  $('#productGallery').html(html);
}


function updateControls() {
  $('#showMore').prop('disabled', currentStart + chunkSize >= offers.length);
  $('#showLess').prop('disabled', currentStart === 0);
  $('#count').text(`Showing ${Math.min(currentStart + 1, offers.length)}-${Math.min(currentStart + chunkSize, offers.length)} of ${offers.length}`);
}

$('#showMore').click(function () {
  currentStart += chunkSize;
  displayOffers(currentStart, currentStart + chunkSize);
  updateControls();
});

$('#showLess').click(function () {
  currentStart = Math.max(0, currentStart - chunkSize);
  displayOffers(currentStart, currentStart + chunkSize);
  updateControls();
});


// ========== CONFIG ==========
var API_KEY = '323e8aa048b9179230f73cd4733cb486';
var incremental = true;
var last_extract_datetime = '2010-01-01 00:0:00';
var format = 'json';
var off_record = false;

fetchOffers();

// Function to fetch offers
async function fetchOffers() {
  try {
    // Try to read the local JSON file
    const fileURL = chrome.runtime.getURL('api_response.json');
    const response = await fetch(fileURL);

    if (response.ok) {
      const data = await response.json();
      console.log("Data found in local JSON file");
      processOffers(data);

      updateControls();
      return;
    }
  } catch (error) {
    console.log("Error reading file:", error);
  }

  // If reading from local JSON fails, try reading from chrome.storage
  chrome.storage.local.get(['api_response'], function (result) {
    if (result.api_response) {
      console.log("Data found in chrome.storage");
      processOffers(result.api_response);
    } else {
      console.log("Data not found in chrome.storage. Fetching from API...");
      // callAPI();
    }
  });
}


// Function to process offers
function processOffers(data) {
  // Check if result is true and offers array exists
  if (data.result && Array.isArray(data.offers)) {
    offers = data.offers.map(function (offer) {
      // Here, I'm assuming your offer objects have 'image', 'title', 'offer_text', and 'merchant_homepage' properties.
      // Modify this as needed based on your actual data structure.
      return {
        image: offer.image_url, // Replace with actual image URL property
        title: offer.title,
        offer_text: offer.offer_text,
        merchant_homepage: offer.merchant_homepage
      };
    });

    // Reset currentStart and initially display first chunk of offers
    currentStart = 0;
    displayOffers(currentStart, currentStart + chunkSize);
  }
}

// Function to call API
function callAPI() {
  var last_extract = (last_extract_datetime === '' ? '' : new Date(last_extract_datetime).getTime() / 1000);

  $.ajax({
    url: 'http://feed.linkmydeals.com/getOffers/',
    type: 'GET',
    data: {
      API_KEY: API_KEY,
      incremental: incremental,
      last_extract: last_extract,
      format: format,
      off_record: off_record
    },
    success: function (data) {
      // Check if data is a string, and if so, parse it to JSON
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      // Save data to chrome.storage
      chrome.storage.local.set({
        'api_response': data
      }, function () {
        console.log('Data saved to chrome.storage');
      });

      processOffers(data);
    },
    error: function (error) {
      console.error('Error:', error);
    }
  });
}





chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateCO2Emissions") {
    let roundedEmissions = parseFloat(message.totalEmissions).toFixed(4);
    document.getElementById('totalEmissions').innerText = `${roundedEmissions}mg`;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateTotalDataWeight") {
    let roundedDataWeight = parseFloat(message.totalDataWeight).toFixed(2);
    document.getElementById('totalDataWeight').innerText = `${roundedDataWeight}`;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateDuration") {
    let roundedDuration = parseFloat(message.duration).toFixed(2);
    document.getElementById('duration').innerText = `${roundedDuration}`;
  }
});



$(document).ready(function () {

  function validateUrl(url) {
    // If the URL starts with `http://` or `https://`, then it is a valid URL.
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return true;
    }

    // If the URL does not start with a protocol, then we need to check to see if it is a valid domain name.
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  }

  $('#urlInputSubmit').click(function () {
    let inputValue = $('#urlInput').val();

    // Validate the URL
    if (!validateUrl(inputValue)) {
      alert("Invalid URL!");
      return;
    }

    // Open the URL in the current tab
    // chrome.tabs.update({
    //   url: inputValue,
    //   active: true
    // });


    // Open the URL in the current tab and get the tab ID
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
      const currentTab = tabs[0];
      chrome.tabs.update(currentTab.id, {
        url: inputValue
      }, function (updatedTab) {
        // Send the tab ID to the background script
        chrome.runtime.sendMessage({
          type: "startTracking",
          tabId: updatedTab.id
        });
      });
    });
  });
});

$(document).ready(function () {
  // Show the first tab by default
  $('#tab1').addClass('active');

  // Handle tab clicks
  $('.tab-button').click(function () {
    // Remove active class from all buttons and tabs
    $('.tab-button').removeClass('active');
    $('.tab-content').removeClass('active');

    // Add active class to clicked button and corresponding tab
    $(this).addClass('active');
    const tabId = $(this).data('tab');
    $('#' + tabId).addClass('active');
  });
});

$(function () {
  $("#slider-range").slider({
    range: true,
    min: 0,
    max: 500,
    values: [75, 300],
    slide: function (event, ui) {
      // Do something when sliding
    }
  });
});

// Content Script
document.getElementById('switchOffDataweightButton').addEventListener('click', () => {
  chrome.runtime.sendMessage({
    type: 'switchOffDataweight'
  });
});

document.getElementById('switchOffDurationButton').addEventListener('click', () => {
  chrome.runtime.sendMessage({
    type: 'switchOffDuration'
  });
});