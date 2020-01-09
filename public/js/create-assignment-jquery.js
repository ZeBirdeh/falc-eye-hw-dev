$(document).ready(function() {
  var $slider = $('#workload');
  var $output = $('#worknum');
  // Update the current slider value (each time you drag the slider handle)
  $slider.on('input', function() {
    $output.text($(this).val());
  });

  $('body').on('click', '[click-editable]', function( event ) {
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
});