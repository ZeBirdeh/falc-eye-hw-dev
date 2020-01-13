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

function getAllInvites() {
  var classID = $('.dashboard').attr('data-cid');
  var url = HOST + '/classes/api/'+classID+'/get-invites';
  return new Promise((resolve, reject) => {
    $.getJSON(url, {}, data => {
      resolve(data)
    })
  })
}

function deleteAssignment(assignID) {
  var classID = $('.dashboard').attr('data-cid');
  var url = HOST + '/classes/api/feed/delete-assignment';
  return new Promise((resolve, reject) => {
    $.post(url, { class: classID, assign: assignID }, data => {
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

function addInviteText(invite) {
  $linkDisplay = $('#invite-links');
  var dateString = new Date(parseInt(invite.expires) * 1000).toLocaleString();
  var displayText = '<p class="invite-link">'+HOST+'/classes/invite/'+invite.id+
    ' <span class="small">Expires: '+dateString+'</span></p>';
  $linkDisplay.append(displayText);
}

function setupInviteButton() {
  $('.invite-btn').on('click', function() {
    getInviteLink().then(result => {
      if (result.status == 'success') {
        addInviteText(result.invite);
      } else {
        // Display error
      }
    });
  })
}

function initializeInviteLinks() {
  getAllInvites().then(result => {
    if (result.status == 'success') {
      result.invites.forEach(invite => {
        addInviteText(invite);
      })
    } else {
      // Display error
    }
  })
}

function setupDeleteButton() {
  $('.delete-btn').on('click', function() {
    var $this = $(this);
    var assignID = $this.parent().prevAll('.assignment').attr('data-aid');
    deleteAssignment(assignID).then(result => {
      if (result.status == 'success') {
        var $listItem = $this.parent().parent('li');
        $listItem.animate({'opacity': 0}, 500);
        setTimeout(function(){$listItem.remove()}, 500);
      } else {
        // Display error
      }
    })
  })
}

$(document).ready( function() {
  minimizeDetails();
  setupInviteButton();
  initializeInviteLinks();
  setupDeleteButton();
})