const HOST = window.location.origin

function getInviteLink() {
  var classID = $('.dashboard').attr('data-cid');
  var url = HOST + '/classes/api/'+classID+'/new-invite';
  return new Promise((resolve, reject) => {
    $.post(url, { duration: 3600 }, data => {
      resolve(data)
    })
  })
}

function minimizeDetails() {
  var speed = 500;
  // Save heights to each section under data-fullheight and minimize
  $('.dropdown-details').each(function() {
    var $this = $(this);
    var height = $this.height();
    $this.attr('data-fullheight', height+'px');
    $this.css('height', '0px');
  });
  $('.dropdown-trigger').on('click', function() {
    var $this = $(this)
    // Setup animations
    var $dropdown = $this.next('.dropdown-details')
    var newHeight = ($dropdown.css('height') == '0px') ? $dropdown.attr('data-fullheight') : '0px';
    var newOpacity = ($dropdown.css('height') == '0px') ? 1 : 0;
    $dropdown.animate({'height': newHeight}, speed)
    $dropdown.children().animate({'opacity': newOpacity}, speed)
  });
}

function setupInviteButton() {
  $('.invite-btn').on('click', function() {
    getInviteLink().then(result => {
      if (result.status == 'success') {
        $('#invite-link').text(HOST+'/classes/invite/'+result.token);
        $('#invite-expire').text(new Date(parseInt(result.expires)).toLocaleString());
      } else {
        $('#invite-link').text('error: could not create link');
      }
    });
  })
}

$(document).ready( function() {
  minimizeDetails();
  setupInviteButton();
})