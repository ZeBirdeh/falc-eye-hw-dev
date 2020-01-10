// GET and POST helper functions for using API
const HOST = "http://localhost:5005"
function getAssignmentStatus(classID, assignID) {
  var url = HOST + '/classes/api/feed/assignment-status'
  return new Promise((resolve, reject) => {
    $.getJSON(url, {class: classID, assign: assignID}, data => {
      resolve(data)
    });
  });
}

function setAssignmentViewed(classID, assignID) {
  var url = HOST + '/classes/api/feed/view-assignment'
  return new Promise((resolve, reject) => {
    $.post(url, {class: classID, assign: assignID}, data => {
      resolve(data)
    })
  })
}

function setAssignmentCompletion(classID, assignID, completion) {
  var url = HOST + '/classes/api/feed/update-assignment'
  return new Promise((resolve, reject) => {
    $.post(url, {class: classID, assign: assignID, completion: completion}, data => {
      resolve(data)
    });
  });
}

// Event handling and formatting

function minimizeDetails() {
  var speed = 500;
  // Save heights to each section under data-fullheight and minimize
  $('.dropdown-details').each(function() {
    var $this = $(this);
    var height = $this.height();
    $this.attr('data-fullheight', height+'px');
    $this.css('height', '0px');
  });
  $('body').on('click', '.dropdown-trigger', function(e) {
    var $this = $(this)
    var $assignDiv = $this.parent()
    if ($assignDiv.attr('new-assign') === '') {
      var classID = $assignDiv.attr('data-cid');
      var assignID = $assignDiv.attr('data-aid');
      setAssignmentViewed(classID, assignID).then(result => {
        if (result.status == 'success') {
          $assignDiv.removeAttr('new-assign');
        } else {
          createPopup('Something went wrong. Please try again later.', true);
          createPopup(JSON.stringify(result));
        }
      });
    }
    // Setup animations
    var $dropdown = $this.next('.dropdown-details')
    var newHeight = ($dropdown.css('height') == '0px') ? $dropdown.attr('data-fullheight') : '0px';
    var newOpacity = ($dropdown.css('height') == '0px') ? 1 : 0;
    $dropdown.animate({'height': newHeight}, speed)
    $dropdown.children().animate({'opacity': newOpacity}, speed)
  });
}

/* Performance might be able to be improved by using "each" and initializing numdisplay once*/
function setupRangeSlider($target) {
	$target.on('input change', function() {
    var $this = $(this);
    var $temp = $this.parent().next();
    var $numdisplay = $temp.children().first('.num-display');
    var rangePercent = $this.val();
    var maxVal = parseInt($this.parents('.assignment').attr('data-max'));
    $numdisplay.text(Math.round((rangePercent / 100) * maxVal));
    $this.css('filter', 'hue-rotate(' + rangePercent*0.6 + 'deg)');
    var $updateButton = $temp.next().children().first('.update-btn');
    $updateButton.removeClass('disabled');
  });
}

function setupUpdateButton() {
  $('body').on('click', '.update-btn:not(.disabled)', function() {
    var $this = $(this);
    $this.addClass('disabled'); // Disable the button after clicked until slider moves
    var $rangeInput = $this.parent().prev().prev().children().first('.slider');
    var rangeVal = $rangeInput.val()
    var $assignmentObj = $this.parents('.assignment');
    var assignID = $assignmentObj.attr('data-aid');
    var classID = $assignmentObj.attr('data-cid');
    setAssignmentCompletion(classID, assignID, rangeVal).then(status => {
      if (status.status == 'success') {
        createPopup('Update successful!');
        if (rangeVal >= 100) {
          $assignmentObj.attr('comp-assign', '');
          $rangeInput.attr('value', '100');
          // Remove the listener from the slider we are about to delete
          $rangeInput.off()
          var assignmentHTML = $assignmentObj.parent()[0].outerHTML;
          var $comp = $('.completed-assignments').children().first('ul');
          $comp.prepend(assignmentHTML)
          $assignmentObj.parent()[0].outerHTML = '';
          // Since the slider is removed and replaced, we reset the listener
          setupRangeSlider($comp.find('.slider').first());
        }
      } else {
        createPopup('Something went wrong. Please try again later.', true);
      }
    });
  })
}

function formatCompletionOnLoad() {
  $('.assignment').each( function() {
    var $this = $(this);
    var assignID = $this.attr('data-aid');
    var classID = $this.attr('data-cid');
    getAssignmentStatus(classID, assignID).then(result => {
      if (result.status == 'new') { // Add new property
        $this.attr('new-assign', '');
      } else if (result.status == 'viewed') { // Initialize slider and text values
        var maxVal = $this.attr('data-max');
        $this.find('.slider').attr('value', result.completion);
        $this.find('.num-display').text(Math.round(result.completion / 100 * maxVal));
        $this.find('.progress-disp').text(Math.round(result.completion / 100 * maxVal) + ' / ');
      } else if (result.status == 'completed') { // Initialize values and move box, then reset sliders
        var maxVal = $this.attr('data-max');
        $this.attr('comp-assign', '');
        $this.find('.slider').attr('value', '100').css('filter', 'hue-rotate(60deg)').off();
        $this.find('.num-display').text(maxVal);
        var assignmentHTML = $this.parent()[0].outerHTML;
        var $comp = $('.completed-assignments').children().first('ul');
        $comp.prepend(assignmentHTML);
        $this.parent()[0].outerHTML = '';
        setupRangeSlider($comp.find('.slider').first());
      } else {
        /* Some error happend with getting the status */
      }
    })
  });
}

// Document on ready function

$(document).ready(function() {
  minimizeDetails();
  setupRangeSlider($('.slider'));
  formatCompletionOnLoad();
  setupUpdateButton();
});

// Additional helper functions

// TODO: create snackbar windows for alerts
function createPopup(msg, err = false) {
  var $alertbox = $('#alerts')
  $alertbox.text(msg);
  if (err) {
    $alertbox.css('color', 'red');
  } else {
    $alertbox.css('color', 'black');
  }
}