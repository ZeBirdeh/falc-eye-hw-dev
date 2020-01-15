$(document).ready(function() {
  var $slider = $('#workload');
  var $output = $('#worknum');
  // Update the current slider value (each time you drag the slider handle)
  $slider.on('input', function() {
    $output.text($(this).val());
  });

  $('assignment-form').on('click', '[click-editable]', function( event ) {
    var $this = $(this);
    var $input = $('<input class="num-input" pattern="[0-9]+" />').val($this.text());
    $input.attr('data-default', $this.text());
    $this.replaceWith($input);
    
    $input.one('blur', function(){
      var newtext = /^[0-9]+$/.test($input.val()) ? $input.val() : $input.attr('data-default');
      var $textbox = $('<p click-editable />').html('<span id="worknum">'+newtext+'</span>');
      $input.replaceWith($textbox);
      $slider.val(newtext)
      $output = $('#worknum');
    });
    $input.focus();
  })

  $('#duedate').val(Math.floor(Date.now() / 1000))
  $('#submit-form').on('click', function() {
    $('#form').submit();
  })

  $('#description').on('input', function() {
    $('#charcount').text(2000 - $(this).val().length)
  })
});