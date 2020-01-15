$(document).ready(function() {
  $('#submit-form').on('click', function() {
    $('#form').submit();
  })

  $('#description').on('input', function() {
    $('#charcount').text(2000 - $(this).val().length)
  })
});