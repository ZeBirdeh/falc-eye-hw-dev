function confirmPopup(message, onConfirm) {
  var popup = '<div class="popup">\n'+
    '<p class="heading">'+message+'</p>\n'+
    '<a class="btn cancel-btn">Cancel</a>'+
    '<a class="btn confirm-btn right">Confirm</a></div>'
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

function leaveClass() {
  var classID = $('#leave-btn').attr('data-cid');
  var url = '/classes/api/'+classID+'/leave-user';
  return new Promise((resolve, reject) => {
    $.post(url, {}, data => {
      resolve(data)
    })
  })
}

function setupUnenrollLink() {
  let $unenroll = $('#leave-btn');
  $unenroll.on('click', function() {
    confirmPopup('Are you sure you want to leave this class?', leaveClass)
  });
}

$(document).ready(function() {
  setupUnenrollLink();
})