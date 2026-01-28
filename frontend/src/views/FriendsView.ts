import { api, resolveAvatarUrl } from '@/api/client';
import { session } from '@/state/session';

export let friendsHandlersAttached = false;

export function FriendsView() {
  if (!session.isAuthenticated()) location.hash = '#/login';

  return `
    <div class="page-background">
      <div class="friends-container">

        <div class="friends-header">
          <h1>Friends</h1>
          <div class="top-buttons">
            <a href="#/dashboard" class="header-btn">Dashboard</a>
          </div>
        </div> 

        <!-- Friends List -->
        <div id="friends-list" class="friends-section">
          <p style="color:#999;">Loading friends...</p>
        </div>

        <!-- Sent Invitations -->
        <div class="invitations-section">
          <h2>Send Invitation</h2>
          <form id="friend-send-form" class="invite-form">
            <input type="text" name="username" class="invite-input" placeholder="Enter username" required />
            <button type="submit" class="invite-btn">Invite</button>
          </form>
          <div id="friend-send-msg" class="friends-message"></div>
        </div>

        <!-- Incoming Invitations -->
        <div class="invitations-section">
          <h2>Incoming Invitations</h2>
          <div id="pending-requests" class="pending-list">
            <p style="color:#999;">Loading...</p>
          </div>
        </div>

      </div>
    </div>
  `;
}

export function cleanupFriendsView() {
  // Remove event listeners to prevent duplicates
  const submitForm = document.getElementById('friend-send-form');
  if (submitForm) {
    const newForm = submitForm.cloneNode(true) as HTMLFormElement;
    submitForm.replaceWith(newForm);
  }

  // Clear DOM content
  const friendsListEl = document.getElementById('friends-list');
  const pendingRequestsEl = document.getElementById('pending-requests');
  const friendSendMsg = document.getElementById('friend-send-msg');

  if (friendsListEl) friendsListEl.innerHTML = '';
  if (pendingRequestsEl) pendingRequestsEl.innerHTML = '';
  if (friendSendMsg) friendSendMsg.textContent = '';
}

async function loadUserProfile(id: number) {
  try {
    const response = await fetch(`https://localhost:3001/api/v1/users/${id}/profile`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
    });
    const profile = await response.json();
    return profile.user;
  } catch (error) {
    console.error('Failed to load user profile:', error);
    return { id, username: 'Unknown', avatar: null };
  }
}

export async function initFriendsHandlers() {
  console.log('initFriendsHandlers: started');

  if (!friendsHandlersAttached) {
    friendsHandlersAttached = true;

    // Clean up any existing content before initializing
    cleanupFriendsView();

    // SUBMIT 
    const submitHandler = async (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (!form.matches('#friend-send-form')) return;
      e.preventDefault();
      const formData = new FormData(form);
      const username = String(formData.get('username'));
      const sendMsg = document.getElementById('friend-send-msg');

      try {
        await api.sendFriendRequest({ username });
        if (sendMsg) {
          sendMsg.textContent = 'Friend request sent!';
          sendMsg.className = 'friends-message success';
        }
        form.reset();
        await loadFriends();
      } catch (err: any) {
        if (sendMsg) {
          sendMsg.textContent = err.message || 'Error sending request';
          sendMsg.className = 'friends-message error';
        }
      }
    };

    document.addEventListener('submit', submitHandler);

    // ACCEPT / DECLINE / DELETE
    const clickHandler = async (e: Event) => {
      const t = e.target as HTMLElement;

      // ACCEPT
      if (t.dataset.accept) {
        await api.acceptFriendRequest(Number(t.dataset.accept));
        await loadFriends();
        return;
      }

      // DECLINE
      if (t.dataset.decline) {
        await api.declineFriendRequest(Number(t.dataset.decline));
        await loadFriends();
        return;
      }

      // DELETE FRIEND
      if (t.dataset.delete) {
        if (confirm('Remove this friend?')) {
          await api.deleteFriend(Number(t.dataset.delete));
          await loadFriends();
        }
        return;
      }
    };

    document.addEventListener('click', clickHandler);
  }

  await loadFriends();
}

async function loadFriends() {
  console.log('loadFriends: fetching data');

  const friendsListEl = document.getElementById('friends-list');
  const pendingRequestsEl = document.getElementById('pending-requests');

  if (!friendsListEl || !pendingRequestsEl) {
    console.warn('FriendsView DOM not ready yet');
    return;
  }

  const { friends } = await api.listFriends();

  if (friends.length === 0) {
    friendsListEl.innerHTML = `<p style="color:#999;">No friends yet</p>`;
  } else {
    const fullFriends = await Promise.all(
      friends.map(async (f: any) => {
        const currentUserId = session.user()?.id;
        const otherId = f.userId === currentUserId ? f.friendId : f.userId;

        const userProfile = await loadUserProfile(otherId);
        return { ...f, profile: userProfile, otherId };
      })
    );

    friendsListEl.innerHTML = fullFriends.map((f: any) => `
  <div class="friend-item-page">
    <div class="friend-info">
      <a href="#/user/${f.otherId}" class="friend-link" title="View profile">
        <img src="${resolveAvatarUrl(f.profile.avatar)}" class="friend-avatar-page" />
        <span class="friend-name-page">${f.profile.username}</span>
      </a>
    </div>
    <div class="friend-actions">
      <button class="remove-btn" data-delete="${f.id}" title="Remove friend">✕</button>
    </div>
  </div>
`).join('');
  }

  const pending = await fetch(
    `https://localhost:3001/api/v1/friends/friends/pending`,
    {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` },
    }
  ).then((r) => r.json());

  const fullIncoming = await Promise.all(
    pending.incoming.map(async (f: any) => {
      const currentUserId = session.user()?.id;
      const otherId = f.userId === currentUserId ? f.friendId : f.userId;

      const userProfile = await loadUserProfile(otherId);
      return { ...f, profile: userProfile, otherId };
    })
  );

  if (pending.incoming.length === 0) {
    pendingRequestsEl.innerHTML = `<p style="color:#999;">No incoming requests</p>`;
  } else {
    pendingRequestsEl.innerHTML = fullIncoming
      .map(
        (req: any) => `
          <div class="pending-item">
            <div class="friend-info">
              <a href="#/user/${req.otherId}" class="friend-link" title="View profile">
                <img src="${resolveAvatarUrl(req.profile.avatar)}" class="friend-avatar-page" />
                <span class="friend-name-page">${req.profile.username}</span>
              </a>
            </div>
            <div class="pending-actions">
              <button data-accept="${req.id}" class="accept-btn">Accept</button>
              <button data-decline="${req.id}" class="decline-btn">Decline</button>
            </div>
          </div>`
      )
      .join('');
  }
}