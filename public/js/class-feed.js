const HOST = "http://localhost:5005"
function getAssignmentStatus(classID, assignID) {
  var url = HOST + '/classes/api/feed/assignment-status'
  return new Promise((resolve, reject) => {
    $.getJSON(url, {class: classID, assign: assignID}, data => {
      resolve(data.status)
    });
  });
}

function setAssignmentCompleted(classID, assignID) {
  var url = HOST + '/classes/api/feed/complete-assignment'
  return new Promise((resolve, reject) => {
    $.post(url, {class: classID, assign: assignID}, data => {
      resolve(data.status)
    });
  });
}

function minimizeDetails() {
  var speed = 500;
  $('.dropdown-details').each(function(i, obj) {
    var $this = $(this);
    var height = $this.height();
    $this.attr('data-fullheight', height+'px');
    $this.css('height', '0px');
  });
  $('.dropdown-trigger').on('click', function(e) {
    var $dropdown = $(this).next('.dropdown-details')
    var newHeight = ($dropdown.css('height') == '0px') ? $dropdown.attr('data-fullheight') : '0px';
    var newOpacity = ($dropdown.css('height') == '0px') ? 1 : 0;
    $dropdown.animate({'height': newHeight}, speed)
    $dropdown.children().each(function(i, obj) {
      $(this).animate({'opacity': newOpacity}, speed)
    });
  });
}
$(document).ready(function() {
  minimizeDetails();
});