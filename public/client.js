$('.songs').on('click', 'div', function() {
  // play state
  var audio = $(this).next('audio')[0]
  $('audio').not(audio).each(function(index, other) {
    other.pause() // pause all other audio
  })
  audio[audio.paused ? 'play' : 'pause']()
  // button appearance
  $('.play').not(this).removeClass('play')
  $(this).toggleClass('play')
  $(audio).on('ended', function() {
    $(this).prev('.play').removeClass('play')
  })
  // all played? show answer button
  $(audio).attr('data-played', 'true')
  if ($('[data-played]').length == $('audio').length) {
    $('#answers + label').css({opacity: 1})
  }
})

$('audio').bind('timeupdate', function() {
  var percent = this.currentTime / this.duration * 100
  $(this).prev('div').css({background: "conic-gradient(#07f " + percent + "%, #eee 0%)" })
})

$('audio').on('ended', function() {
  $(this).parent().removeClass('play')
})

$('body').keyup(function(e) {
  if (e.keyCode == 32) {
    $('audio:not([data-played])').first().prev('div').click()
  }
})

$('#answers').change(function() {
  $('.songs').toggleClass('answers')
})