const HOST = window.location.origin;

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
  let onConfirmFunction = () => {
    var classID = $('.dashboard').attr('data-cid');
    var url = '/classes/api/'+classID+'/ban-user';
    return new Promise((resolve, reject) => {
      $.post(url, { username: username }, data => {
        resolve(data)
      })
    })
  }
  let onCancel = () => {return {status: 'cancelled'}}
  return confirmPopup('Are you sure you want to ban this user?', onConfirmFunction, onCancel);
}

function removeUser(username) {
  let onConfirmFunction = () => {
    var classID = $('.dashboard').attr('data-cid');
    var url = '/classes/api/'+classID+'/remove-user';
    return new Promise((resolve, reject) => {
      $.post(url, { username: username }, data => {
        resolve(data)
      })
    })
  }
  let onCancel = () => {return {status: 'cancelled'}}
  return confirmPopup('Are you sure you want to remove this user?', onConfirmFunction, onCancel);
}

function updateClassDetails() {
  var classID = $('.dashboard').attr('data-cid');
  let url = '/classes/api/'+classID+'/update-data';
  let className = $('#class-name').val();
  let classDesc = $('#class-description').val();
  return new Promise((resolve, reject) => {
    $.post(url, { name: className, description: classDesc }, data => {
      resolve(data)
    })
  })
}

function initClassUpdate() {
  $('#charcount').text(2000 - $('#class-description').val().length)
  $('#class-description').on('input', function() {
    $('#charcount').text(2000 - $(this).val().length)
  })
  $('#update-btn').on('click', function() {
    updateClassDetails().then(result => {
      if (result.status == 'success') {
        snackbarText('Succesfully updated class details');
      } else {
        snackbarText('Failed to update class details. Please try again later.')
      }
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
    ' <span class="small right">Expires: '+dateString+'</span></p>';
  $linkDisplay.append(displayText);
}

function setupInviteButton() {
  $('.invite-btn').on('click', function() {
    getInviteLink().then(result => {
      if (result.status == 'success') {
        addInviteText(result.invite);
      } else if (result.status == 'failed') {
        snackbarText('The maximum number of active invites has been reached.');
      } else {
        snackbarText('Error in creating invite link.');
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
      addInviteText('Failed to fetch active invites.')
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
    confirmPopup('Are you sure you want to delete this assignment?', onConfirmFunction);
  })
}

function setupUserButton() {
  $('#get-users').one('click', function() {
    $(this).next('.hidden-details').css('display', 'block');
    let $userList = $('#users-list');
    let $bannedUserList = $('#banned-users-list');
    let startName = $userList.attr('data-last');
    let adminUsername = $userList.attr('data-username');
    getUsers(startName).then(result => {
      if (result.status == 'success') {
        result.users.forEach(userData => {
          // Fill row with user information
          let $newUser = $('<li/>').addClass('user').html($('<div/>').addClass('med-col').text(userData.username));
          let $isAdmin = $('<div/>').addClass('small-col')
          if (userData.isAdmin) { $isAdmin.html($('<span/>').addClass('emphasized').text('Admin')) }
          $newUser.append($isAdmin);
          let $buttons = $('<div/>').addClass('small-col')
          if (adminUsername == userData.username) {
            $newUser.append($buttons.html('<span class="heading">You</span>'));
            $userList.append($newUser);
            return; // Skip the button generation
          }
          // Generate the remove button
          let $removeButton = $('<a/>').addClass('btn remove-btn').text('Remove').on('click', function() {
            let username = $newUser.children().first().text();
            removeUser(username).then(status => {
              if (status.status == 'success') {
                $newUser.remove();
              } else if (!(status.status == 'cancelled')) {
                snackbarText('There was an error in removing this user');
              }
            });
          });
          // Add the remove button
          $buttons.append($removeButton);
          if (userData.isBanned) {
            $newUser.append($buttons)
            $bannedUserList.append($newUser);
          } else {
            // Generate and add the ban button
            let $banButton = $('<a/>').addClass('btn ban-btn right').text('Ban').on('click', function() {
              let username = $newUser.children().first().text();
              banUser(username).then(status => {
                if (status.status == 'success') {
                  $(this).remove();
                  $bannedUserList.append($newUser.remove());
                } else if (!(status.status == 'cancelled')) {
                  snackbarText('There was an error in banning this user');
                }
              });
            });
            $newUser.append($buttons.append($banButton));
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

function snackbarText(text) {
  $('.snackbar').text(text).attr('show', '');
  setTimeout(function() {
    $('.snackbar').removeAttr('show');
  }, 5000);
}

function confirmPopup(message, onConfirm, onCancel=()=>{}) {
  return new Promise((resolve, reject) => {
    var popup = '<div class="popup">\n'+
      '<p class="heading">'+message+'</p>\n'+
      '<a class="btn cancel-btn">Cancel</a>'+
      '<a class="btn confirm-btn right">Confirm</a></div>'
    var overlay = $('<div/>', {class: 'confirm-overlay'}).append(popup);
    $('body').append(overlay);
    $('.cancel-btn').on('click', function() {
      $('.confirm-overlay').remove();
      resolve(onCancel());
    })
    $('.confirm-overlay').on('click', function() {
      $('.confirm-overlay').remove();
      resolve(onCancel());
    })
    $('.confirm-btn').on('click', function() {
      $('.confirm-overlay').remove();
      resolve(onConfirm());
    })
  })
}

$(document).ready( function() {
  minimizeDetails();
  setupInviteButton();
  initializeInviteLinks();
  setupDeleteButton();
  setupUserButton();
  initClassUpdate();
})