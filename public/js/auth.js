function startVerificationPolling() {
  const token = localStorage.getItem('refreshToken');
  if (!token) return;

  const interval = setInterval(async () => {
    try {
      const response = await axios.get('http://localhost:3000/v1/auth/check-verification', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.verified) {
        clearInterval(interval);
        updateVerificationUI();
      }
    } catch (err) {
      console.error('Error checking verification:', err);
    }
  }, 5000); // Polling setiap 5 detik
}

function updateVerificationUI() {
  $('#check-email-ui h2').text('Verify Email Success');
  $('#check-email-ui p').first().text('Your email has been successfully verified!');
  $('#check-email-ui .btn-email').hide();
  $('#check-email-ui .resend-text').hide();
}



function register() {
  $('#regist-form').on('submit', async function (event) {
    event.preventDefault();
    $('.regist-btn button').text('Sending...').prop('disabled', true);

    const username = $('#registUsername').val();
    const email = $('#registEmail').val();
    const password = $('#registPassword').val();
    const requestData = { username, email, password };

    try {
      const response = await axios.post('http://localhost:3000/v1/auth/register', requestData);
      const token = response.data?.token?.access?.token;
      if (!token) {
        console.log('Token not found');
        return;
      }

      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', response.data?.token?.refresh?.token);

      $('#item-regist-form').hide();
      $('#check-email-ui').show();

      await sendVerifRequest(token);
      startVerificationPolling();
    } catch (err) {
      console.log('Error ', err.response);

      const rawError = err.response?.data?.message || err.response?.data;
      let message = 'Something went wrong.';

      if (typeof rawError === 'string') {
        message = rawError;
      } else if (Array.isArray(parsedError) && parsedError.length > 0) {
        message = parsedError.map((e) => `${e.message}`).join('<br>');
      } else if (typeof rawError === 'object' && rawError.message) {
        message = rawError.message;
      }

      $('#text-alert-regist p').html(message);
      $('.regist-btn button').text('Sign Up').prop('disabled', false);
      $('#text-alert-regist').show();
    }
  });
}

async function sendVerifRequest(token) {
  try {
    const response = await axios.post(
      'http://localhost:3000/v1/auth/send-verification-email',
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    localStorage.setItem('verifyToken', response.token);
    console.log('Verification email sent');
  } catch (err) {
    console.log('Error sending verification:', err);
    return;
  }
}

function resendVerifEmail() {
  $('#resend-link').on('click', async function (event) {
    event.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('Token not found');
      return;
    }
    await sendVerifRequest(token);

    let countdown = 15;
    const $btn = $(this);
    $btn.prop('disable', true).text(`Resend in ${countdown}`);
    const timer = setInterval(function () {
      countdown--;
      if (countdown > 0) {
        $btn.text(`Resend in ${countdown}`);
      } else {
        clearInterval(timer);
        $btn.prop('disable', false).text('Click to Resend');
      }
    }, 1000);
  });
}

function login() {
  $('#login-form').on('submit', async function (event) {
    event.preventDefault();
    $('.login-btn button').text('Memuat...').prop('disabled', true);

    const email = $('#loginEmail').val();
    const password = $('#loginPassword').val();
    const requestData = { email, password };

    try {
      const response = await axios.post('http://localhost:3000/v1/auth/login', requestData);
      localStorage.setItem('currentUserId', response.data.data.id);
      localStorage.setItem('accessToken', response.data.token.access.token);
      localStorage.setItem('refreshToken', response.data.token.refresh.token);

      setTimeout(() => {
        window.location.href = '/chats';
      }, 2000);

      // history.replaceState(null, null, '/index');
    } catch (err) {
      console.log('Error ', err.response);
      const rawError = err.response?.data?.message || err.response?.data;
      let message = 'Something went wrong.';

      if (typeof rawError === 'string') {
        message = rawError;
      } else if (Array.isArray(rawError) && rawError.length > 0) {
        message = rawError.map((e) => `${e.message}`).join('<br>');
      } else if (typeof rawError === 'object' && rawError.message) {
        message = rawError.message;
      }

      $('#text-alert-login p').html(message);
      $('.login-btn button').text('Login').prop('disabled', false);
      $('#text-alert-login').show();
    }
  });
}


$(document).ready(function () {
  register();
  resendVerifEmail();
  login();
});
