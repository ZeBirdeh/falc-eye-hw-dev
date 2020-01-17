function addClassNames() {
  $('.assignment').each(function() {
    const $this = $(this);
    let classid = $this.attr('data-cid');
    let classname = $('[data-cidref='+classid+']').attr('data-name');
    $this.find('.class-disp').text(classname);
  })
}

$(document).ready(function() {
  addClassNames();
});
