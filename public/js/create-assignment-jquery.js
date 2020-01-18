$(document).ready(function() {
  var $slider = $('#workload');
  var $output = $('#worknum');
  // Update the current slider value (each time you drag the slider handle)
  $slider.on('input', function() {
    let $this = $(this)
    var rangePercent = $this.val();
    $output.text(rangePercent);
    $this.css('filter', 'hue-rotate(' + rangePercent*0.6 + 'deg)');
  });

  $('.assignment-form').on('click', '[click-editable]', function( event ) {
    var $this = $(this);
    var $input = $('<input class="num-input" maxlength="3" pattern="[0-9]+" />').val($this.text());
    $input.attr('data-default', $this.text());
    $this.replaceWith($input);
    
    $input.one('blur', function(){
      var newtext = /^[0-9]+$/.test($input.val()) ? $input.val() : $input.attr('data-default');
      var $textbox = $('<p class="num-display" id="worknum" click-editable/>').text(newtext);
      $input.replaceWith($textbox);
      $slider.val(newtext)
      $output = $('#worknum');
    });
    $input.focus();
  })

  $('#submit-form').on('click', function() {
    $form = $('#form')
    if ($form.valid()) {
      $form.submit();
    }
  })

  $('#description').on('input', function() {
    $('#charcount').text(2000 - $(this).val().length)
  })

  let curTime = new Date();
  let curTimeString = (new Date(curTime.getTime() - curTime.getTimezoneOffset()*60000)).toISOString().substring(0, 16)
  $('#duedate').attr('min', curTimeString).val(curTimeString)

  var query = window.location.search.substring(1);
  var queryObj = {}
  query.split("&").forEach(queryVal => {
    var kvPair = queryVal.split("=");
    queryObj[kvPair[0]] = kvPair[1];
  })
  var errnum = queryObj['e'];
  if (errnum == 1) { $('#errormessage').text("Invalid input.") }
  if (errnum == 2) { $('#errormessage').text("You do not have the necessary permissions to perform this action.") }
});