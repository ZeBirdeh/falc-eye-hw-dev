$(document).ready(function() {
  $('#nav-btn').on('click', function() {
    event.stopPropagation();
    $('#dropdown-nav').toggleClass('hidden')
  })
  $(document).on('click', function() {
    $('#dropdown-nav').addClass('hidden')
  })
})