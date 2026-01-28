import { session } from '@/state/session';
import { api, resolveAvatarUrl } from '@/api/client';
import { setForcedMode } from '@/state/gameMode';

export function DashboardView() {
  const user = session.user();
  const username = user?.username || user?.email?.split('@')[0] || 'JSmith';
  const avatarUrl = resolveAvatarUrl(user?.avatar || '/avatars/avatar.jpg');
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  return `
    <div class="page-background">
      <div class="main-wrapper">
        
        <!-- Header -->
        <header class="header">
          <div class="logo">Transcendence Pong 3D</div>
          <div class="top-buttons">
            <a href="#/settings" class="header-btn">⚙ Settings</a>
            <button class="header-btn logout" id="logout-btn">⎋ Logout</button>
          </div>
        </header>

        <!-- GRID -->
        <div class="grid">

          <!-- MENU -->
          <div class="card menu">
            <h3>Game</h3>
            <button id="play-1v1-btn">Play 1v1</button>
            <button id="play-ai-btn">Play vs AI</button>
            <button id="tournament-btn">Tournament</button>
          </div>

          <!-- PROFILE -->
            <div class="card profile">
              <img src="${avatarUrl}" class="avatar" alt="User Avatar" id="user-avatar" style="display:block; margin:0 auto;">
              <h2 id="username-display" style="font-size: 22px; font-weight: 700; color: #1e293b; margin: 12px 0 8px 0;">${displayName}</h2>
              <p class="rank" id="user-rank" style="font-size: 14px; color: #64748b; margin: 0 0 16px 0;">Rank: —</p>
              <div class="presence">
                <span class="presence-dot offline" id="presence-dot" aria-hidden="true"></span>
                <span class="presence-text" id="presence-text" style="color: #374151; font-weight: 600;">Offline</span>
                <button type="button" class="presence-toggle" id="presence-toggle" style="color: #374151;">Go Online</button>
              </div>
            </div>

          <!-- LEADERBOARD -->
          <div class="card tournament leaderboard-card">
            <h3>Leaderboard</h3>
            <ul id="leaderboard-list">
              <li style="color:#999; font-size:14px;">Loading…</li>
            </ul>
            <button class="view-btn leaderboard-view" id="view-leaderboard">View</button>
          </div>

          <!-- FRIENDS -->
          <div class="card friends">
            <h3>Friends</h3>
            <div id="dashboard-friends-list">
              <!-- Loading state; will be replaced by loadFriendsList() -->
              <p style="color: #999; font-size: 14px;">Loading friends…</p>
            </div>
            <div id="dashboard-friend-requests-counter"
              style="font-size:13px; color:#64748b; margin-top:8px; min-height:18px;">
            </div>
            <button class="view-btn" id="view-friends">View</button>
          </div>

          <!-- MATCH STATS -->
          <div class="card match-stats">
            <h3>Match Stats</h3>
            <div class="stats-summary" id="stats-summary">
              <div><strong style="color: #1e293b; font-size: 14px;">Games</strong><br><span id="total-games" style="font-size: 20px; font-weight: 700; color: #1e293b;">0</span></div>
              <div><strong style="color: #1e293b; font-size: 14px;">Wins</strong><br><span id="total-wins" style="font-size: 20px; font-weight: 700; color: #1e293b;">0</span></div>
              <div><strong style="color: #1e293b; font-size: 14px;">Losses</strong><br><span id="total-losses" style="font-size: 20px; font-weight: 700; color: #1e293b;">0</span></div>
              <div><strong style="color: #1e293b; font-size: 14px;">Win Rate</strong><br><span id="win-rate" style="font-size: 20px; font-weight: 700; color: #1e293b;">0%</span></div>
            </div>
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Opponent</th>
                  <th>Score</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody id="match-history">
                <tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:20px;">No matches played!</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initDashboardHandlers() {

  console.log('initDashboardHandlers started'); // Лог: функция вызвана

  // Start presence connection
  setupPresenceWS();

  function findAndAttach(id: string, handler: () => void) {
    let btn = document.getElementById(id);
    if (btn) {
      console.log(`Button found: ${id}`, btn);
      btn.addEventListener('click', handler);
    } else {
      console.warn(`Button not found immediately: ${id}`);

      let attempts = 0;
      const interval = setInterval(() => {
        btn = document.getElementById(id);
        if (btn || attempts >= 3) {
          clearInterval(interval);
          if (btn) btn.addEventListener('click', handler);
        }
        attempts++;
      }, 100);
    }
  }

  // Logout handler
  const logoutBtn = document.getElementById('logout-btn');
  console.log('Looking for logout button:', logoutBtn);
  logoutBtn?.addEventListener('click', handleLogout);

  // Presence toggle handler
  const presenceToggle = document.getElementById('presence-toggle');
  presenceToggle?.addEventListener('click', handlePresenceToggle);

  // Game menu handlers
  findAndAttach('play-1v1-btn', () => {
    console.log('Play 1v1 clicked, setting mode to 1v1');
    setForcedMode('1v1');
    window.location.hash = '#/game';
  });

  findAndAttach('play-ai-btn', () => {
    console.log('Play AI clicked, setting mode to ai');
    setForcedMode('ai');
    window.location.hash = '#/game';
  });

  requestAnimationFrame(() => {
    const tournamentBtn = document.getElementById('tournament-btn');
    console.log("BTN:", tournamentBtn);

    tournamentBtn?.addEventListener('click', () => {
      console.log('Tournament clicked, setting mode to tournament');
      setForcedMode('tournament');
      window.location.hash = '#/tournaments';
    });
  });

  const viewLeaderboardBtn = document.getElementById('view-leaderboard');
  viewLeaderboardBtn?.addEventListener('click', () => {
    window.location.hash = '#/leaderboard';
  });

  const viewFriendsBtn = document.getElementById('view-friends');
  console.log('Looking for view-friends button:', viewFriendsBtn);
  viewFriendsBtn?.addEventListener('click', () => {
    console.log('View Friends button clicked - navigating to #/friends');
    window.location.hash = '#/friends';
  });

  // Update avatar from session
  const user = session.user();
  const avatarEl = document.getElementById('user-avatar') as HTMLImageElement | null;
  if (avatarEl && user?.avatar) {
    avatarEl.src = resolveAvatarUrl(user.avatar);
  }

  // Load dashboard data
  loadDashboardData();
  startFriendsPresenceAutoRefresh();
}

// Presence WebSocket management
let presenceWS: WebSocket | null = null;
let presencePingInterval: number | null = null;
let presenceDesiredOnline = true;

// Dashboard friends refresh interval
let friendsPresenceIntervalId: number | null = null;

function setupPresenceWS() {
  if (!presenceDesiredOnline) return;
  const token = session.token();
  if (!token) return;

  const url = `wss://localhost:3001/api/v1/presence/ws?token=${encodeURIComponent(token)}`;
  try {
    presenceWS = new WebSocket(url);
  } catch {
    updatePresenceUI(false);
    return;
  }

  presenceWS.onopen = () => {
    updatePresenceUI(true);
    if (presencePingInterval) clearInterval(presencePingInterval);
    presencePingInterval = window.setInterval(() => {
      try { presenceWS?.send('ping'); } catch { }
    }, 30_000);
  };

  presenceWS.onmessage = (ev) => {
    if (ev.data === 'pong') {
      // latency/last-seen handling
    }
  };

  presenceWS.onclose = () => {
    cleanupPresenceTimers();
    updatePresenceUI(false);
    if (presenceDesiredOnline) {
      setTimeout(() => setupPresenceWS(), 3000); // reconnect
    }
  };

  presenceWS.onerror = () => {
    // Silent close
  };
}

function cleanupPresenceTimers() {
  if (presencePingInterval) {
    clearInterval(presencePingInterval);
    presencePingInterval = null;
  }
}

function updatePresenceUI(online: boolean) {
  const dot = document.getElementById('presence-dot');
  const text = document.getElementById('presence-text');
  const btn = document.getElementById('presence-toggle');
  if (!dot || !text || !btn) return;
  dot.classList.remove('online', 'offline');
  dot.classList.add(online ? 'online' : 'offline');
  text.textContent = online ? 'Online' : 'Offline';
  btn.textContent = online ? 'Go Offline' : 'Go Online';
}

function handlePresenceToggle() {
  presenceDesiredOnline = !presenceDesiredOnline;
  if (presenceDesiredOnline) {
    setupPresenceWS();
  } else {
    presenceWS?.close();
    presenceWS = null;
    cleanupPresenceTimers();
    updatePresenceUI(false);
  }
}

function handleLogout() {
  presenceDesiredOnline = false;
  presenceWS?.close();
  presenceWS = null;
  cleanupPresenceTimers();
  console.log('Handling logout - clearing session');
  session.clear();
  console.log('Session cleared, redirecting to login');
  window.location.hash = '#/login';
}

async function loadDashboardData() {
  try {
    await Promise.allSettled([
      loadUserProfile(),
      loadFriendsList(),
      loadMatchStats(),
      loadLeaderboard(),
    ]);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

async function loadUserProfile() {
  try {
    const user = session.user();
    if (!user) return;

    const rankEl = document.getElementById('user-rank');
    if (!rankEl) return;

    const token = session.token();
    const res = await fetch(
      `https://localhost:3001/api/v1/leaderboard/rank?userId=${encodeURIComponent(user.id)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      rankEl.textContent = 'Rank: —';
      return;
    }
    const data = await res.json();
    const rank = Number(data?.rank ?? 0);
    const points = Number(data?.pointsTotal ?? 0);

    rankEl.textContent = `Rank: ${rank > 0 ? rank.toLocaleString() : '—'} (${points.toLocaleString()} pts)`;
  } catch {
    const rankEl = document.getElementById('user-rank');
    if (rankEl) rankEl.textContent = 'Rank: —';
  }
}

async function loadFriendsList() {
  try {
    // Guard: only update on dashboard route and if container exists
    if (window.location.hash !== '#/dashboard') return;

    const friendsListEl = document.getElementById('dashboard-friends-list');
    const counterEl = document.getElementById('dashboard-friend-requests-counter');
    if (!friendsListEl) return;

    // --- 1. Load friends ---
    const response = await api.listFriends();
    const friends = response.friends;

 try {
      const pending = await fetch(
        `https://localhost:3001/api/v1/friends/friends/pending`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        }
      ).then((r) => r.json());
      //console.log("counterEl:", counterEl);
      //console.log("pending:", pending);

      if (counterEl) {
        const count = pending?.incoming?.length || 0;
        if (count > 0) {
          counterEl.textContent = `You have ${count} friend request${count === 1 ? '' : 's'}`;
        } else {
          counterEl.textContent = '';
        }
      }
    } catch (err) {
      console.warn('Failed to fetch pending requests count');
      if (counterEl) counterEl.textContent = '';
    }

    if (friends.length === 0) {
      friendsListEl.innerHTML = `
        <p style="color:#999; font-size:14px;">No friends yet</p>
      `;
      //if (counterEl) counterEl.textContent = '';
      return;
    }

    // if (friends.length === 0) {
    //   friendsListEl.innerHTML = `
    //     <p style="color:#999; font-size:14px;">No friends yet</p>
    //   `;
    //   if (counterEl) counterEl.textContent = '';
    //   return;
    // }

    // --- 2. Load presence statuses ---
    let presenceStatuses: any[] = [];
    try {
      const token = session.token();
      const res = await fetch(`https://localhost:3001/api/v1/presence/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      presenceStatuses = await res.json();
    } catch (err) {
      console.warn('Could not fetch presence statuses, defaulting offline', err);
    }

    // --- 3. Load full profiles for each friend ---
    type FullFriend = {
      id: number;
      profile: { username: string; avatar: string | null };
      presence: { status?: string };
    };

    const fullFriends: FullFriend[] = await Promise.all(
      friends.map(async (f) => {
        const otherId =
          f.userId === session.user()?.id ? f.friendId : f.userId;

        // profile
        let profile: { username: string; avatar: string | null } = { username: 'Unknown', avatar: '/avatars/avatar.jpg' };
        try {
          const r = await fetch(
            `https://localhost:3001/api/v1/users/${otherId}/profile`,
            {
              headers: {
                Authorization: `Bearer ${sessionStorage.getItem('token')}`,
              },
            }
          );
          const data = await r.json();
          if (data?.user) profile = data.user;
        } catch {
          console.warn('Failed to load profile for user', otherId);
        }

        // presence
        const p = presenceStatuses.find((p) => p.userId === otherId);
        const presence: { status?: string } = p || { status: 'offline' };

        return {
          id: otherId,
          profile,
          presence,
        };
      })
    );

    // --- 4. Render top3 friends ---
    const top3: FullFriend[] = fullFriends.slice(0, 3);

    friendsListEl.innerHTML = top3
      .map((friend: FullFriend) => {
        const avatar = resolveAvatarUrl(friend.profile.avatar);
        const username = friend.profile.username;
        const statusClass =
          friend.presence?.status === 'online' ? 'green' : 'grey';

        return `
          <div class="friend">
            <img src="${avatar}" class="friend-avatar" alt="${username}">
            <span class="friend-name">${username}</span>
            <div class="status-dot ${statusClass}"></div>
          </div>
        `;
      })
      .join('');

    // // --- 5. Load pending requests for dashboard counter ---
    // try {
    //   const pending = await fetch(
    //     `https://localhost:3001/api/v1/friends/friends/pending`,
    //     {
    //       headers: {
    //         Authorization: `Bearer ${sessionStorage.getItem('token')}`,
    //       },
    //     }
    //   ).then((r) => r.json());

    //   if (counterEl) {
    //     const count = pending?.incoming?.length || 0;
    //     if (count > 0) {
    //       counterEl.textContent = `You have ${count} friend request${count === 1 ? '' : 's'}`;
    //     } else {
    //       counterEl.textContent = '';
    //     }
    //   }
    // } catch (err) {
    //   console.warn('Failed to fetch pending requests count');
    //   if (counterEl) counterEl.textContent = '';
    // }
  } catch (err) {
    console.error('Error loading friends:', err);
    const friendsListEl = document.getElementById('dashboard-friends-list');
    if (friendsListEl) {
      friendsListEl.innerHTML =
        '<p style="color:#ef4444; font-size:14px;">Failed to load friends</p>';
    }
  }
}

function startFriendsPresenceAutoRefresh() {
  if (friendsPresenceIntervalId) {
    clearInterval(friendsPresenceIntervalId);
  }
  // Run immediately once on dashboard
  if (window.location.hash === '#/dashboard') {
    loadFriendsList();
  }
  friendsPresenceIntervalId = window.setInterval(() => {
    if (window.location.hash === '#/dashboard') {
      loadFriendsList(); // refresh friends and their online status
    } else {
      // Stop refreshing when leaving dashboard
      if (friendsPresenceIntervalId) {
        clearInterval(friendsPresenceIntervalId);
        friendsPresenceIntervalId = null;
      }
    }
  }, 15_000);
}

async function loadMatchStats() {
  try {
    const user = session.user();
    console.log('loadMatchStats: user =', user);
    if (!user?.id) {
      console.warn('loadMatchStats: No user ID found');
      return;
    }

    // Fetch detailed stats for the logged-in user
    console.log('loadMatchStats: Fetching stats for user ID:', user.id);
    const stats = await api.getUserStatsDetailed(user.id);
    console.log('loadMatchStats: Received stats:', stats);

    // Update summary stats
    const totalGamesEl = document.getElementById('total-games');
    const totalWinsEl = document.getElementById('total-wins');
    const totalLossesEl = document.getElementById('total-losses');
    const winRateEl = document.getElementById('win-rate');

    console.log('Elements found:', { totalGamesEl, totalWinsEl, totalLossesEl, winRateEl });

    if (totalGamesEl) {
      totalGamesEl.textContent = String(stats.games);
      console.log('Updated total-games to:', stats.games);
    }
    if (totalWinsEl) {
      totalWinsEl.textContent = String(stats.wins);
      console.log('Updated total-wins to:', stats.wins);
    }
    if (totalLossesEl) {
      totalLossesEl.textContent = String(stats.losses);
      console.log('Updated total-losses to:', stats.losses);
    }
    if (winRateEl) {
      winRateEl.textContent = `${stats.winRate}%`;
      console.log('Updated win-rate to:', `${stats.winRate}%`);
    }

    // Update match history table
    const matchHistoryEl = document.getElementById('match-history');
    console.log('Match history element:', matchHistoryEl);
    console.log('Stats matches:', stats.matches, 'Length:', stats.matches?.length);

    if (matchHistoryEl && stats.matches && stats.matches.length > 0) {
      // Filter out pending matches - only show completed ones
      const completedMatches = stats.matches.filter(match => match.result === 'WIN' || match.result === 'LOSS');
      
      if (completedMatches.length === 0) {
        matchHistoryEl.innerHTML = '<tr><td colspan="4" style="color:#64748b; text-align:center; padding:14px;">No completed matches</td></tr>';
      } else {
        matchHistoryEl.innerHTML = completedMatches.slice(0, 5).map((match) => {
          const date = match.date ? new Date(match.date).toLocaleDateString() : 'N/A';
          const score = match.score ? match.score : `${match.userScore || 0} - ${match.opponentScore || 0}`;
          const resultClass = match.result === 'WIN' ? 'result-win' : 'result-loss';
          const resultText = match.result === 'WIN' ? 'Win' : 'Loss';

          return `
            <tr>
              <td>${date}</td>
              <td>${match.opponentUsername || 'Unknown'}</td>
              <td>${score}</td>
              <td class="${resultClass}">${resultText}</td>
            </tr>
          `;
        }).join('');
      }
      console.log('Updated match history table');
    } else {
      console.log('No match history to display or match history element not found');
    }
  } catch (error) {
    console.error('Error loading match stats:', error);
    // Keep default values if API fails
  }
}

async function loadLeaderboard() {
  try {
    const leaderboard = await api.getLeaderboard(4, 0);
    const leaderboardEl = document.getElementById('leaderboard-list');
    if (!leaderboardEl) return;

    if (!leaderboard || leaderboard.length === 0) {
      leaderboardEl.innerHTML = `<li style="color:#999; font-size:14px;">No leaderboard data</li>`;
      return;
    }

    leaderboardEl.innerHTML = leaderboard.slice(0, 4).map((entry, index: number) => {
      const username = entry.username || 'Unknown';
      const score = entry.pointsTotal ?? entry.points ?? 0;
      return `
        <li>
          <span style="color: #1e293b; font-weight: 500;">${index + 1}. ${username}</span>
          <span style="color: #64748b; font-weight: 600;">${score}</span>
        </li>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    const leaderboardEl = document.getElementById('leaderboard-list');
    if (leaderboardEl) {
      leaderboardEl.innerHTML = `<li style="color:#ef4444; font-size:14px;">Failed to load leaderboard</li>`;
    }
  }
}

export function cleanupDashboardHandlers() {
  if (friendsPresenceIntervalId) {
    clearInterval(friendsPresenceIntervalId);
    friendsPresenceIntervalId = null;
  }
}