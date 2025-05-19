function togglePassword() {
  $('#toggle-pw-login').on('click', function () {
    let input = $('#loginPassword');
    let icon = $(this);
    if (input.attr('type') === 'password') {
      input.attr('type', 'text');
      icon.removeClass('fa-eye-slash').addClass('fa-eye');
    } else {
      input.attr('type', 'password');
      icon.removeClass('fa-eye').addClass('fa-eye-slash');
    }
  });

  $('#toggle-pw-regist').on('click', function () {
    let input = $('#registPassword');
    let icon = $(this);
    if (input.attr('type') === 'password') {
      input.attr('type', 'text');
      icon.removeClass('fa-eye-slash').addClass('fa-eye');
    } else {
      input.attr('type', 'password');
      icon.removeClass('fa-eye').addClass('fa-eye-slash');
    }
  });
}

function switchLanding() {
  $('#toggle-regist').on('click', function () {
    $('#item-login-form').hide();
    $('#item-regist-form').show();
  });

  $('#toggle-login').on('click', function () {
    $('#item-regist-form').hide();
    $('#item-login-form').show();
  });

  $('#toggle-checkMail').on('click', function () {
    $('#check-email-ui').hide();
    $('#item-regist-form').hide();
    $('#item-login-form').show();
  })
}

function darkMode() {
  let darkmode = localStorage.getItem('darkmode');
  let textDarkmode = $('#text-theme');

  const enableDarkMode = () => {
    $('body').addClass('darkmode');
    localStorage.setItem('darkmode', 'active');
    if (textDarkmode.length) textDarkmode.text('Darkmode');
  };

  const disableDarkMode = () => {
    $('body').removeClass('darkmode');
    localStorage.setItem('darkmode', null);
    if (textDarkmode.length) textDarkmode.text('Lightmode');
  };

  if (darkmode === 'active') enableDarkMode();

  $('#theme-switch').on('click', function () {
    darkmode = localStorage.getItem('darkmode');
    darkmode !== 'active' ? enableDarkMode() : disableDarkMode();
  });
}

$(document).ready(function() {
  togglePassword(),
  switchLanding(),
  darkMode()
});