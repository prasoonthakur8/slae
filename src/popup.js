import $ from 'jquery';
import './styles.css';

import 'jquery-ui/ui/widgets/slider';

$(document).ready(function () {
  $('#sayHiButton').click(function () {
    alert('Hello');
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