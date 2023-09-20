import $ from 'jquery';
import './styles.css';

import 'jquery-ui/ui/widgets/slider';

$(document).ready(function () {
  $('#sayHiButton').click(function () {
    alert('Hello');
  });
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
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      chrome.tabs.update(currentTab.id, { url: inputValue }, function (updatedTab) {
        // Send the tab ID to the background script
        chrome.runtime.sendMessage({ type: "startTracking", tabId: updatedTab.id });
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