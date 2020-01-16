function getUsers(startName) {
  var classID = $('.dashboard').attr('data-cid');
  var url = '/classes/api/'+classID+'/get-users';
  return new Promise((resolve, reject) => {
    $.getJSON(url, { startName: startName }, data => {
      resolve(data)
    })
  })
}

function getInviteLink() {
  var classID = $('.dashboard').attr('data-cid');
  var url = '/classes/api/'+classID+'/new-invite';
  return new Promise((resolve, reject) => {
    $.post(url, { duration: 3600 }, data => {
      resolve(data)
    })
  })
}

function getAllInvites() {
  var classID = $('.dashboard').attr('data-cid');
  var url = '/classes/api/'+classID+'/get-invites';
  return new Promise((resolve, reject) => {
    $.getJSON(url, {}, data => {
      resolve(data)
    })
  })
}

function deleteAssignment(assignID) {
  var classID = $('.dashboard').attr('data-cid');
  var url = '/classes/api/feed/delete-assignment';
  return new Promise((resolve, reject) => {
    $.post(url, { class: classID, assign: assignID }, data => {
      resolve(data)
    })
  })
}

function banUser(username) {
  var classID = $('.dashboard').attr('data-cid');
  var url = '/classes/api/'+classID+'/ban-user';
  return new Promise((resolve, reject) => {
    $.post(url, { username: username }, data => {
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
  $('.hidden-details').css('display', 'none');
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
    var onConfirmFunction = () => {
      deleteAssignment(assignID).then(result => {
        if (result.status == 'success') {
          var $listItem = $this.parent().parent('li');
          $listItem.animate({'opacity': 0}, 500);
          setTimeout(function(){$listItem.remove()}, 500);
        } else {
          // Display error
        }
      })
    }
    confirmPopup(onConfirmFunction);
  })
}

function setupUserButton() {
  $('#get-users').one('click', function() {
    $(this).next('.hidden-details').css('display', 'block');
    let $userList = $('#users-list');
    let $bannedUserList = $('#banned-users-list');
    let startName = $userList.attr('data-last');
    getUsers(startName).then(result => {
      if (result.status == 'success') {
        result.users.forEach(userData => {
          let $newUser = $('<li/>').addClass('user').html($('<div/>').addClass('med-col').text(userData.username));
          let $isAdmin = $('<div/>').addClass('small-col')
          if (userData.isAdmin) { $isAdmin.html($('<span/>').addClass('emphasized').text('Admin')) }
          $newUser.append($isAdmin);
          if (userData.isBanned) {
            $bannedUserList.append($newUser);
          } else {
            let $banButton = $('<div/>').addClass('small-col').html(
              $('<a/>').addClass('btn').addClass('ban-btn').text('Ban')
            ).one('click', function() {
              let $this = $(this)
              let username = $newUser.children().first().text();
              banUser(username);
              $this.remove();
              $bannedUserList.append($newUser.remove());
            });
            $newUser.append($banButton);
            $userList.append($newUser);
          }
        })
        let lastName = result.users[result.users.length - 1].username;
        $userList.attr('data-last', lastName);
      } else {
        // Display error
      }
    });
  })
}

function confirmPopup(onConfirm) {
  var popup = '<div class="popup">\n'+
    '<p class="heading">Are you sure you want to delete this assignment</p>\n'+
    '<p id="assign-name"></p>\n'+
    '<a class="btn cancel-btn">Cancel</a>'+
    '<a class="btn confirm-btn">Confirm</a></div>'
  var overlay = $('<div/>', {class: 'confirm-overlay'}).append(popup);
  $('body').append(overlay);
  $('.cancel-btn').on('click', function() {
    $('.confirm-overlay').remove();
  })
  $('.confirm-overlay').on('click', function() {
    $('.confirm-overlay').remove();
  })
  $('.confirm-btn').on('click', function() {
    onConfirm();
    $('.confirm-overlay').remove();
  })
}

$(document).ready( function() {
  minimizeDetails();
  setupInviteButton();
  initializeInviteLinks();
  setupDeleteButton();
  setupUserButton();
})