let chats = {};
let onlineUsers = new Set();
let ws;

async function logout() {
  $('#logout-button').on('click', async function (evenet) {
    evenet.preventDefault();

    const token = localStorage.getItem('refreshToken');
    if (!token) {
      console.error('No refresh token found');
      return;
    }

    try {
      await axios.post('http://localhost:3000/v1/auth/logout', { token });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUserId');
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    } catch (err) {
      console.error('Logout failed:', err);
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 400) {
          alert('Logout failed: Invalid refresh token. Logging out locally.');
          console.log('Logout failed: Invalid refresh token. Logging out locally.');
        } else {
          alert(`Logout failed: ${err.response.data.error || 'Unknown error'}`);
          console.log(`Logout failed: ${err.response.data.error || 'Unknown error'}`);
        }
      } else {
        alert('Failed to connect to the server. Logging out locally.');
      }

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUserId');
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
  });
}

async function getCurrentUser() {
  const token = localStorage.getItem('accessToken');
  const userId = localStorage.getItem('currentUserId');
  if (!token || !userId) {
    console.error('No access token or user ID found. Please log in.');
    alert('Please log in to continue.');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUserId');
    window.location.href = '/auth';
    return null;
  }

  try {
    const response = await axios.get(`http://localhost:3000/v1/users/current-user`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.user;
  } catch (err) {
    console.error('Error getting current user:', err);
    if (err.response && err.response.status === 401) {
      alert('Session expired or invalid token. Please log in again.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUserId');
      window.location.href = '/auth';
    }
    return null;
  }
}

// Fungsi untuk mengambil daftar user
async function getUsers() {
  const token = localStorage.getItem('accessToken');
  const currentUserId = localStorage.getItem('currentUserId');
  if (!token || !currentUserId) {
    console.error('No access token or user ID found. Please log in.');
    alert('Please log in to continue.');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUserId');
    window.location.href = '/auth';
    return;
  }

  try {
    const response = await axios.get('http://localhost:3000/v1/users/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    // await renderChatItems(response.data.users);
    const result = response.data;
    console.log('All users:', result);

    let users = [];
    if (result && result.users) {
      users = Array.isArray(result.users)
        ? result.users.map((user) => ({
            id: user.id,
            username: user.username,
            status: user.status || (onlineUsers.has(user.id.toString()) ? 'online' : 'offline'),
            profilePic: user.profilePic || '../assets/default-profile.jpg',
            lastSeen: user.lastSeen
              ? new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''
          }))
        : [];
    }

    $('#chat-items').empty();
    await renderChatItems(users);
  } catch (err) {
    console.error('Error getting users:', err);
    if (err.response) {
      if (err.response.status === 401) {
        alert('Session expired or invalid token. Please log in again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUserId');
        window.location.href = '/auth.html';
      } else if (err.response.status === 404) {
        alert('Users endpoint not found. Please check the server.');
      } else {
        alert(`Failed to fetch users: ${err.response.data.error || 'Unknown error'}`);
      }
    } else {
      alert('Failed to connect to the server. Please check your connection.');
    }
  }
}

async function getRecentMessage(userId) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.error('No access token. Please log in.');
    alert('Please log in to continue.');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUserId');
    window.location.href = '/auth';
    return;
  }

  try {
    const response = await axios.get(`http://localhost:3000/v1/messages/recentMessages/${userId}`, {
      params: { receiverId: userId },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data || [];
  } catch (err) {
    console.error('Error getting messages:', err);
    if (err.response && err.response.status === 404) {
      return [];
    }
    return [];
  }
}

async function getLastMessage(userId) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.error('No access token. Please log in.');
    alert('Please log in to continue.');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUserId');
    window.location.href = '/auth';
    return;
  }

  try {
    const response = await axios.get(`http://localhost:3000/v1/messages/lastMessage/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data || null;
  } catch (err) {
    console.error('Error getting messages:', err);
    if (err.response && err.response.status === 404) {
      return null;
    }
    return null;
  }
}

// Fungsi untuk mendapatkan waktu pesan terakhir
async function getLastMessageTime(userId) {
  try {
    const lastMessage = await getLastMessage(userId);
    if (!lastMessage || !lastMessage.createdAt) {
      return '';
    }

    const messageDate = new Date(lastMessage.createdAt);
    const today = new Date();
    let yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const result = (dayOne, dayTwo) => {
      return (
        dayOne.getDate() === dayTwo.getDate() &&
        dayOne.getMonth() === dayTwo.getMonth() &&
        dayOne.getFullYear() === dayTwo.getFullYear()
      );
    };

    if (result(messageDate, today)) {
      return messageDate.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (result(messageDate, yesterday)) {
      return 'kemarin';
    } else {
      return messageDate.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  } catch (err) {
    console.error('Error in getLastMessageTime:', err);
    return;
  }
}

function deleteMessage() {
  $(document).on('click', '.delete-message-btn', async function (event) {
    event.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No access token. Please log in.');
      alert('Please log in to continue.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUserId');
      window.location.href = '/auth';
      return;
    }

    const messageElement = $(this).closest('.message');
    const messageId = messageElement.data('message-id');
    const userId = $('#chat-room').data('activeChatUserId');

    try {
      const response = await axios.delete(`http://localhost:3000/v1/messages/deleteMessage/${String(messageId)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Error delete message:', err);
      if (err.response) {
        if (err.response.status === 401) {
          alert('Session expired or invalid token. Please log in again.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('currentUserId');
          window.location.href = '/auth';
        } else if (err.response.status === 404) {
          alert('Users endpoint not found. Please check the server.');
        } else {
          alert(`Failed to delete message: ${err.response.data.error || 'Unknown error'}`);
        }
      } else {
        alert('Failed to connect to the server. Please check your connection.');
      }
    }
  });
}

function isOnlines(status) {
  if (status === 'online') {
    return 'style="border: 3px solid #51cb20"';
  }
  return '';
}

// Fungsi untuk merender chat items
async function renderChatItems(usersToRender) {
  $('#chat-items').empty();
  if (usersToRender.length === 0) {
    $('#chat-items').append('<p id="alert-user">No users available.</p>');
    return;
  }

  const messagePromises = usersToRender.map(async (user) => {
    const lastMessage = await getLastMessage(user.id);
    const lastMessageTime = await getLastMessageTime(user.id);
    return { user, lastMessage, lastMessageTime };
  });

  // Tunggu semua promise selesai
  const userMessages = await Promise.all(messagePromises);

  userMessages.forEach(({ user, lastMessage, lastMessageTime }) => {
    const isOnline = user.status || (onlineUsers.has(user.id.toString()) ? 'online' : 'offline');
    $('#chat-status').text(isOnline);
    const previewText = lastMessage
      ? lastMessage.text.split(' ').slice(0, 10).join(' ') + (lastMessage.text.split(' ').length > 10 ? '...' : '')
      : 'Mulai percakapan...';

    $('#chat-items').append(`
      <div class="chat-item" data-user-id="${user.id}" data-username="${user.username}" data-status="${isOnline}">
        <img src="${user.profilePic || '../assets/default-profile.jpg'}" alt="Profile Picture" class="profile-pic" ${isOnlines(isOnline)}/>
        <div class="chat-info">
          <div class="chat-name">${user.username}</div>
          <div class="chat-preview">${previewText}</div>
        </div>
        <div class="chat-meta">
          <span class="time">${lastMessageTime}</span>
        </div>
      </div>
    `);
  });

  $('.chat-item')
    .off('click')
    .on('click', function () {
      $('.chat-item').removeClass('active');
      $(this).addClass('active');
      const userId = $(this).data('user-id');
      const username = $(this).data('username');
      showChatRoom(userId, username);
    });
}

async function showChatRoom(userId, username) {
  $('#default-ad').hide();
  $('#edit-profile-content').hide();
  $('#chat-room-content').show();

  $('#chat-room-name').text(username);
  const isOnline = onlineUsers.has(userId.toString()) ? 'online' : 'offline';
  $('#chat-status').text(isOnline);
  const profilePic = $(`.chat-item[data-user-id="${userId}"] .profile-pic`).attr('src');
  $('#chat-room-pic').attr('src', profilePic || '../assets/default-profile.jpg');

  // Set activeChatUserId
  $('#chat-room').data('activeChatUserId', userId);

  // Ambil pesan terbaru dan render
  chats[userId] = await getRecentMessage(userId);
  $('#chat-messages').empty();
  const currentUserId = localStorage.getItem('currentUserId');
  if (chats[userId] && chats[userId].length > 0) {
    chats[userId].forEach((msg) => {
      const messageClass = String(msg.senderId) === String(currentUserId) ? 'sent' : 'received';
      const hasDeleteButton = String(msg.senderId) === String(currentUserId);
      const messageHtml = `
        <div class="message ${messageClass}" data-message-id="${msg.id}" data-sender-id="${msg.senderId}">
          ${msg.image ? `<img src="${msg.image}" alt="Image" class="message-image"/>` : ''}
          ${msg.text ? `<div class="message-text">${msg.text}</div>` : ''}
          ${
            hasDeleteButton
              ? `
            <button class="delete-message-btn">
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
              </svg>
            </button>
          `
              : ''
          }
        </div>
      `;
      $('#chat-messages').append(messageHtml);
    });
  }

  $('#chat-messages').scrollTop($('#chat-messages')[0].scrollHeight);

  // Perbarui status dan preview
  const chatItem = $(`.chat-item[data-user-id="${userId}"]`);
  chatItem.attr('data-status', isOnline);
  const lastMessage = chats[userId] && chats[userId].length > 0 ? chats[userId][chats[userId].length - 1] : null;
  if (lastMessage) {
    chatItem
      .find('.chat-preview')
      .text(
        lastMessage.text.split(' ').slice(0, 10).join(' ') + (lastMessage.text.split(' ').length > 10 ? '...' : '')
      );
    chatItem
      .find('.time')
      .text(new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  } else {
    chatItem.find('.chat-preview').text('Mulai percakapan...');
    chatItem.find('.time').text('');
  }
}

// Inisialisasi WebSocket
function initWebSocket() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.error('No token found. Please log in first.');
    return;
  }

  const wsUrl = `ws://localhost:3000/v1/ws?token=${encodeURIComponent(token)}`;
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  ws.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.event === 'getOnlineUsers') {
        console.log('Online users:', message.data);
        onlineUsers = new Set(message.data.userId);
        await getUsers();

        const activeChatUserId = $('#chat-room').data('activeChatUserId');
        if (activeChatUserId) {
          const isOnline = onlineUsers.has(activeChatUserId.toString()) ? 'online' : 'offline';
          $('#chat-status').text(isOnline);

          const chatItem = $(`.chat-item[data-user-id="${activeChatUserId}"]`);
          chatItem.attr('data-status', isOnline);
        }
      } else if (message.event === 'newMessage') {
        const newMessage = message.data;
        const userId = newMessage.senderId;
        const currentUserId = localStorage.getItem('currentUserId');
        if (!chats[userId]) chats[userId] = [];
        chats[userId].push(newMessage);
        if ($('#chat-room').data('activeChatUserId') === userId) {
          $('#chat-messages').append(`
          <div class="message ${newMessage.senderId === currentUserId ? 'sent' : 'received'}" data-message-id="${newMessage.id}" data-sender-id="${newMessage.senderId}">
            ${newMessage.image ? `<img src="${newMessage.image}" alt="Image" class="message-image" />` : ''}
            ${newMessage.text ? `<div class="message-text">${newMessage.text}</div>` : ''}
          </div>
        `);
          $('#chat-messages').scrollTop($('#chat-messages')[0].scrollHeight);
        }
        const chatItem = $(`.chat-item[data-user-id="${userId}"]`);
        chatItem
          .find('.chat-preview')
          .text(
            newMessage.text.split(' ').slice(0, 10).join(' ') + (newMessage.text.split(' ').length > 10 ? '...' : '')
          );
        chatItem
          .find('.time')
          .text(
            newMessage.createdAt
              ? new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          );
      } else if (message.event === 'messageSent') {
        const newMessage = message.data;
        const userId = newMessage.receiverId;
        const currentUserId = localStorage.getItem('currentUserId');
        if (!chats[userId]) chats[userId] = [];
        chats[userId].push(newMessage);
        if ($('#chat-room').data('activeChatUserId') === userId) {
          const isSent = String(newMessage.senderId) === String(currentUserId);
          const messageHtml = `
          <div class="message ${isSent ? 'sent' : 'received'}" data-message-id="${newMessage.id}" data-sender-id="${newMessage.senderId}">
            ${newMessage.image ? `<img src="${newMessage.image}" alt="Image" class="message-image" />` : ''}
            ${newMessage.text ? `<div class="message-text">${newMessage.text}</div>` : ''}
            ${
              isSent
                ? `
          <button class="delete-message-btn">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
          </button>`
                : ''
            }
          </div>
        `;
          $('#chat-messages').append(messageHtml);
          console.log(
            `New message added: text="${newMessage.text}", senderId=${newMessage.senderId}, class=${isSent ? 'sent' : 'received'}, has delete button=${isSent}`
          );
          $('#chat-messages').scrollTop($('#chat-messages')[0].scrollHeight);
        }
        const chatItem = $(`.chat-item[data-user-id="${userId}"]`);
        chatItem
          .find('.chat-preview')
          .text(
            newMessage.text.split(' ').slice(0, 10).join(' ') + (newMessage.text.split(' ').length > 10 ? '...' : '')
          );
        chatItem
          .find('.time')
          .text(
            newMessage.createdAt
              ? new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          );
      } else if (message.event === 'profileUpdated') {
        const { userId, username, bio, profilePic } = message.data;
        const targetUserId = userId[0]; // Ambil userId pertama dari array
        console.log(`User ${targetUserId} updated their profile`);

        const chatItem = $(`.chat-item[data-user-id="${targetUserId}"]`);
        chatItem.find('.chat-name').text(username);
        chatItem.find('.profile-pic').attr('src', profilePic || '../assets/default-profile.jpg');

        const activeChatUserId = $('#chat-room').data('activeChatUserId');
        if (activeChatUserId === targetUserId) {
          $('#chat-room-name').text(username);
          $('#chat-room-pic').attr('src', profilePic || '../assets/default-profile.jpg');
        }
      } else if (message.event === 'profilePicDeleted') {
        const { userId, profilePic } = message.data;
        const targetUserId = userId[0]; // Ambil userId pertama dari array

        $(`.chat-item[data-user-id="${targetUserId}"] .profile-pic`).attr(
          'src',
          profilePic || '../assets/default-profile.jpg'
        );

        const activeChatUserId = $('#chat-room').data('activeChatUserId');
        if (activeChatUserId === targetUserId) {
          $('#chat-room-pic').attr('src', profilePic || '../assets/default-profile.jpg');
        }
      } else if (message.event === 'messageDeleted') {
        const { messageId, userId, receiverId } = message.data;
        console.log('messageDeleted: ', message.data);
        const currentUserId = localStorage.getItem('currentUserId');
        const userIdChat = String(currentUserId) === String(userId) ? receiverId : userId;

        if (chats[userIdChat]) {
          chats[userIdChat] = chats[userIdChat].filter((msg) => msg.id !== messageId);

          // Hapus elemen dari DOM berdasarkan messageId, terlepas dari ruang obrolan aktif
          const messageElement = $(`.message[data-message-id="${messageId}"]`);
          if (messageElement.length) {
            messageElement.addClass('fade-out');
            setTimeout(() => {
              messageElement.remove();
            }, 300);
          }

          // Perbarui preview chat untuk chat yang relevan
          const chatItem = $(`.chat-item[data-user-id="${userIdChat}"]`);
          const lastMessage = chats[userIdChat][chats[userIdChat].length - 1];
          const previewText = lastMessage
            ? lastMessage.text.split(' ').slice(0, 10).join(' ') +
              (lastMessage.text.split(' ').length > 10 ? '...' : '')
            : 'Mulai percakapan...';
          chatItem.find('.chat-preview').text(previewText);
          chatItem
            .find('.time')
            .text(
              lastMessage
                ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''
            );
          // showChatRoom(userId, username)
          console.log(`Message ${messageId} deleted by user ${userId} in chat with ${userIdChat}`);
        }
      } else if (message.error) {
        console.error('WebSocket error:', message.error);
        ws.close();
        alert('WebSocket authentication failed. Please log in again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUserId');
        window.location.href = '/auth.html';
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  ws.onclose = () => {
    console.log('Disconnected from WebSocket server');
    setTimeout(initWebSocket, 5000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    console.log('WebSocket readyState:', ws.readyState);
    console.log('WebSocket URL:', ws.url);
  };
}

function previewUpdateProfile(user) {
  $('.edit-profile-form').empty();

  $('.edit-profile-form').append(`
    <div class="profile-pic-section">
      <img src="${user.profilePic || '../assets/default-profile.jpg'}" alt="Profile Picture" class="profile-pic-large" id="profile-pic-preview" />
      <div class="profile-pic-section-button">
      <label for="profile-pic-input" class="change-pic-btn">Change Photo</label>
      <input type="file" id="profile-pic-input" accept="image/*" style="display: none;" />
      <button class="delete-profile" >Delete Profile</button>
      </div>
    </div>
    <div class="form-group">
      <label for="username">Username</label>
      <input type="text" id="username" value="${user.username}" />
    </div>
    <div class="form-group">
      <label for="bio">Bio</label>
      <textarea id="bio" placeholder="${user.bio || 'Tell something about yourself...'}">${user.bio || ''}</textarea>
    </div>
    <button class="save-btn">Save Changes</button>
  `);

  setupProfilePicPreview();

  $('.save-btn')
    .off('click')
    .on('click', async function () {
      await updateProfile();
    });
}

async function deleteProfile() {
  $('.delete-profile').on('click', async function () {
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('currentUserId');
    if (!token || !userId) {
      console.error('No access token or user ID found. Please log in.');
      alert('Please log in to continue.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUserId');
      window.location.href = '/auth';
      return null;
    }

    try {
      const response = await axios.delete('http://localhost:3000/v1/auth/delete-profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const updatedUser = response.data.user;
      console.log('Profile picture deleted:', updatedUser);

      // Perbarui UI secara lokal
      // 1. Perbarui foto profil di preview edit profile
      $('#profile-pic-preview').attr('src', '../assets/default-profile.jpg');

      // 2. Perbarui foto profil di sidebar (chat items)
      $(`.chat-item[data-user-id="${userId}"] .profile-pic`).attr('src', '../assets/default-profile.jpg');

      // 3. Perbarui foto profil di header chat room (jika pengguna sedang mengobrol dengan user ini)
      const activeChatUserId = $('#chat-room').data('activeChatUserId');
      if (activeChatUserId === userId) {
        $('#chat-room-pic').attr('src', '../assets/default-profile.jpg');
      }
    } catch (err) {
      console.error('Error getting users:', err);
      if (err.response) {
        if (err.response.status === 401) {
          alert('Session expired or invalid token. Please log in again.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('currentUserId');
          window.location.href = '/auth';
        } else if (err.response.status === 404) {
          alert('Users endpoint not found. Please check the server.');
        } else {
          alert(`Failed to fetch users: ${err.response.data.error || 'Unknown error'}`);
        }
      } else {
        alert('Failed to connect to the server. Please check your connection.');
      }
    }
  });
}

// Fungsi untuk memperbarui profil pengguna
async function updateProfile() {
  const token = localStorage.getItem('accessToken');
  const userId = localStorage.getItem('currentUserId');
  if (!token || !userId) {
    console.error('No access token or user ID found. Please log in.');
    alert('Please log in to continue.');
    return;
  }

  const newUsername = $('#username').val().trim();
  const newBio = $('#bio').val().trim();
  const profilePicInput = $('#profile-pic-input')[0].files[0];

  try {
    let profilePicBase64 = null;
    if (profilePicInput) {
      // Konversi file gambar ke base64
      profilePicBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(profilePicInput);
      });
    }

    const response = await axios.put(
      'http://localhost:3000/v1/auth/update-profile',
      {
        username: newUsername,
        bio: newBio,
        profilePic: profilePicBase64 || ''
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const updatedUser = response.data.data[0];
    console.log('Profile updated:', updatedUser);

    // Perbarui UI dengan data baru
    // 1. Perbarui username dan bio di form edit profile
    $('#username').val(updatedUser.username);
    $('#bio').val(updatedUser.bio || '');

    // 2. Perbarui foto profil di preview edit profile
    const newProfilePic = updatedUser.profilePic || '';
    $('#profile-pic-preview').attr('src', newProfilePic);

    // 3. Perbarui foto profil di sidebar (chat items)
    $(`.chat-item[data-user-id="${userId}"] .profile-pic`).attr('src', newProfilePic);

    // 4. Perbarui foto profil di header chat room (jika pengguna sedang mengobrol dengan user ini)
    const activeChatUserId = $('#chat-room').data('activeChatUserId');
    if (activeChatUserId === userId) {
      $('#chat-room-pic').attr('src', newProfilePic);
    }

    // 5. Perbarui username di sidebar dan header chat room
    $(`.chat-item[data-user-id="${userId}"] .chat-name`).text(updatedUser.username);
    if (activeChatUserId === userId) {
      $('#chat-room-name').text(updatedUser.username);
    }

  } catch (err) {
    console.error('Error updating profile:', err);
    if (err.response) {
      if (err.response.status === 401) {
        alert('Session expired or invalid token. Please log in again.');
        performLocalLogout();
      } else {
        alert(`Failed to update profile: ${err.response.data.error || 'Unknown error'}`);
      }
    } else {
      alert('Failed to connect to the server. Please check your connection.');
    }
  }
}

// Fungsi untuk menangani preview foto profil saat memilih file
function setupProfilePicPreview() {
  $('#profile-pic-input').on('change', function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        $('#profile-pic-preview').attr('src', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });
}

function visibleSendMessage() {
  const messageInput = $('#message-input');
  const sendButton = $('#send-message');
  const sendPicInput = $('#send-pic-input');
  const imagePreview = $('#image-preview');
  const previewImage = $('#preview-image');
  const removePreview = $('#remove-preview');

  const updateSendButtonVisibility = () => {
    const text = messageInput.val().trim();
    const previewVisible = imagePreview.css('display') !== 'none';
    if (text !== '' || previewVisible) {
      sendButton.addClass('visible');
    } else {
      sendButton.removeClass('visible');
    }
  };

  sendPicInput.on('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImage.attr('src', event.target.result);
        imagePreview.css('display', 'block');
        updateSendButtonVisibility();
      };
      reader.readAsDataURL(file);
    }
  });

  removePreview.on('click', () => {
    previewImage.attr('src', '');
    imagePreview.css('display', 'none');
    sendPicInput.val('');
    updateSendButtonVisibility();
  });

  if (messageInput.length && sendButton.length) {
    messageInput.on('input', () => {
      updateSendButtonVisibility();
    });

    messageInput.on('keydown', (event) => {
      const text = messageInput.val().trim();
      const previewVisible = imagePreview.css('display') !== 'none';

      if ((event.key === 'Backspace' || event.key === 'Delete') && text === '' && !previewVisible) {
        sendButton.removeClass('visible');
      }
    });
  }

  sendButton.on('click', async function (event) {
    event.preventDefault();
    const userId = $('#chat-room').data('activeChatUserId');
    const text = messageInput.val().trim();
    let image = null;

    if (sendPicInput[0].files.length > 0) {
      const file = sendPicInput[0].files[0];
      const reader = new FileReader();
      image = await new Promise((resolve) => {
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(file);
      });
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      alert('WebSocket connection is not open. Please try again later.');
      return;
    }

    if (text || image) {
      try {
        ws.send(
          JSON.stringify({
            event: 'newMessage',
            data: {
              receiverId: userId,
              content: text,
              image: image
            }
          })
        );
        console.log('Message sent:', { text, image });
        messageInput.val('');
        previewImage.attr('src', '');
        imagePreview.css('display', 'none');
        sendPicInput.val('');
        sendButton.removeClass('visible');
      } catch (err) {
        console.error('Failed to send message:', err);
        alert('Failed to send message. Please try again.');
      }
    }
  });
}

$('#edit-profile').on('click', async function () {
  console.log('Edit profile button clicked');
  const currentUser = await getCurrentUser();
  console.log('current user: ', currentUser);
  $('.chat-item').removeClass('active');
  if (currentUser) {
    $('#default-ad').hide();
    $('#chat-room-content').hide();
    $('#edit-profile-content').show();
    previewUpdateProfile(currentUser);
    deleteProfile();
  }
});

$(document).ready(async function () {
  await getUsers();
  searchUser();
  deleteMessage();
  initWebSocket();
  visibleSendMessage();
  logout();
  setupProfilePicPreview();
});

$('#message-input').keypress(function (e) {
  if (e.which === 13) {
    if (!e.shiftKey) {
      // Kirim pesan hanya jika Shift tidak ditekan
      e.preventDefault();
      $('#send-message').click();
    }
  }
});

//untuk menunda eksekusi selama 300ms, mencegah panggilan berulang saat pengguna mengetik cepat
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

async function searchUser() {
  const debouncedSearch = debounce(async (searchQuery) => {
    if (!searchQuery) {
      await getUsers();
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:3000/v1/users/getUsers?username=${encodeURIComponent(searchQuery)}`,
        {});

      const result = response.data;
      console.log('Search result:', result);

      let users = [];
      if (result && result.users) {
        users = Array.isArray(result.users)
          ? result.users.map((user) => ({
              id: user.id,
              username: user.username,
              status: user.status || (onlineUsers.has(user.id.toString()) ? 'online' : 'offline'),
              profilePic: user.profilePic || '../assets/default-profile.jpg',
              lastSeen: user.lastSeen
                ? new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : ''
            }))
          : [];
      }

      $('#chat-items').empty();
      await renderChatItems(users);
    } catch (error) {
      console.error('Error searching users:', error);
      if (error.response) {
        console.error('Server responded with:', error.response.status, error.response.data);
      }
      await renderChatItems([]);
    }
  }, 500);

  $('#search-input').on('input', async function () {
    const searchQuery = $(this).val().trim();
    await debouncedSearch(searchQuery);
  });
}