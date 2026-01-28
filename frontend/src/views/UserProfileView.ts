import { session } from '@/state/session';
import { api, resolveAvatarUrl } from '@/api/client';

export function UserProfileView(params?: Record<string, string>) {
  if (!session.isAuthenticated()) {
    location.hash = '#/login';
  }

  const id = params?.id ? Number(params.id) : NaN;
  const initialAvatarUrl = resolveAvatarUrl('/avatars/avatar.jpg');

  return `
      <div class="page-background">
        <div class="main-wrapper" data-profile-user-id="${Number.isFinite(id) ? id : ''}">

        <!-- Header -->
        <header class="header">
          <div class="logo">👤 User Profile</div>
          <div class="top-buttons">
            <a href="#/dashboard" class="header-btn">🏠 Dashboard</a>
          </div>
        </header>

        <div class="grid">
          <!-- User Profile -->
          <section class="card profile" aria-labelledby="user-title">
            <h2 id="user-title" class="sr-only">User</h2>
            <img src="${initialAvatarUrl}" class="avatar" alt="User Avatar" id="profile-avatar" />
            <h2 class="username" id="profile-username">Loading…</h2>
            <p class="rank" id="profile-rank">Rank: — • Points: —</p>

            <!-- Presence (read-only) -->
            <div class="presence" aria-label="Presence">
              <span class="presence-dot offline" aria-hidden="true"></span>
              <span class="presence-text">Offline</span>
            </div>

            <!-- Actions -->
            <div class="profile-actions" style="display: flex; gap: 12px; margin-top: 16px;">
              <button class="profile-action primary" id="add-friend-btn" style="width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">➕ Add Friend</button>
            </div>
          </section>

          <!-- Match Stats -->
          <section class="card match-stats" aria-labelledby="stats-title">
            <h2 id="stats-title">Match Stats</h2>

            <div class="stats-summary">
              <div><strong>Games</strong><br><span id="profile-total">—</span></div>
              <div><strong>Wins</strong><br><span id="profile-wins">—</span></div>
              <div><strong>Losses</strong><br><span id="profile-losses">—</span></div>
              <div><strong>Win Rate</strong><br><span id="profile-winrate">—</span></div>
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
              <tbody>
                <tr>
                  <td colspan="4" style="color:#64748b; text-align:center; padding:14px;">Match history not loaded</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

      </div>
    </div>
    `;
}

export function initUserProfileHandlers(_params?: Record<string, string>) {
  console.log('initUserProfileHandlers called with params:', _params);
  const urlUserId = _params?.id ? Number(_params.id) : NaN;

  setTimeout(() => {
    const wrapper = document.querySelector('.main-wrapper[data-profile-user-id]') as HTMLElement | null;
    const idRaw = wrapper?.dataset.profileUserId;
    const userId = idRaw ? Number(idRaw) : urlUserId;

    const usernameEl = document.getElementById('profile-username');
    const avatarEl = document.getElementById('profile-avatar') as HTMLImageElement | null;
    const rankEl = document.getElementById('profile-rank');
    const totalEl = document.getElementById('profile-total');
    const winsEl = document.getElementById('profile-wins');
    const lossesEl = document.getElementById('profile-losses');
    const winRateEl = document.getElementById('profile-winrate');
    const matchHistoryBody = document.querySelector('.stats-table tbody') as HTMLTableSectionElement | null;

    const presenceDot = document.querySelector('.presence .presence-dot') as HTMLElement | null;
    const presenceText = document.querySelector('.presence .presence-text') as HTMLElement | null;

    if (!Number.isFinite(userId)) {
      if (usernameEl) usernameEl.textContent = 'User not found';
      return;
    }

    const setPresence = (status: 'online' | 'offline', label?: string) => {
      if (!presenceDot || !presenceText) return;
      presenceDot.classList.toggle('online', status === 'online');
      presenceDot.classList.toggle('offline', status !== 'online');
      presenceText.textContent = label ?? (status === 'online' ? 'Online' : 'Offline');
    };

    const refreshPresence = async () => {
      try {
        // Public route (any authenticated user). If not available, fallback.
        const p = await api.getUserPresencePublic(userId);
        setPresence(p.status);
      } catch {
        try {
          // Friends-only route (self or accepted friends)
          const p = await api.getUserPresence(userId);
          setPresence(p.status);
        } catch (err: any) {
          const m = String(err?.message || '');
          if (m.includes('Not a friend') || m.includes('403')) {
            setPresence('offline', 'Private');
          } else {
            console.warn('Presence refresh failed', err);
          }
        }
      }
    };

    // Profile + rank
    Promise.all([
      api.getUserProfile(userId),
      api.getUserRank(userId).catch(() => null),
    ])
      .then(([profile, rank]) => {
        if (avatarEl) avatarEl.src = resolveAvatarUrl(profile.user.avatar || '/avatars/avatar.jpg');
        if (usernameEl) usernameEl.textContent = profile.user.username;

        const rankLabel = rank?.rank ? `#${rank.rank}` : '—';
        const pointsLabel = rank?.pointsTotal != null ? new Intl.NumberFormat().format(rank.pointsTotal) : '—';
        if (rankEl) rankEl.textContent = `Rank: ${rankLabel} • Points: ${pointsLabel}`;

        const wins = profile.stats.wins ?? 0;
        const losses = profile.stats.losses ?? 0;
        const total = profile.stats.totalMatches ?? (wins + losses);
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

        if (totalEl) totalEl.textContent = String(total);
        if (winsEl) winsEl.textContent = String(wins);
        if (lossesEl) lossesEl.textContent = String(losses);
        if (winRateEl) winRateEl.textContent = `${winRate}%`;
      })
      .catch((err) => {
        console.error('UserProfileView: Failed to load user profile', err);
        if (usernameEl) usernameEl.textContent = 'Failed to load profile';
      });

    // Match history
    api.getUserMatchHistory(userId)
      .then((matches) => {
        if (!matchHistoryBody) return;
        if (!matches || matches.length === 0) {
          matchHistoryBody.innerHTML = '<tr><td colspan="4" style="color:#64748b; text-align:center; padding:14px;">No matches played</td></tr>';
          return;
        }
        
        // Filter out pending matches - only show completed ones
        const completedMatches = matches.filter((match: any) => match.result === 'WIN' || match.result === 'LOSS');
        
        if (completedMatches.length === 0) {
          matchHistoryBody.innerHTML = '<tr><td colspan="4" style="color:#64748b; text-align:center; padding:14px;">No completed matches</td></tr>';
          return;
        }
        
        matchHistoryBody.innerHTML = completedMatches.map((match: any) => {
          const date = match.finishedAt ? new Date(match.finishedAt).toLocaleDateString() : 'Unknown';
          const opponent = match.opponent?.alias || 'Unknown';
          const score = `${match.userScore ?? 0} - ${match.opponentScore ?? 0}`;
          const result = match.result === 'WIN' ? '🏆 Win' : '❌ Loss';
          const resultClass = match.result === 'WIN' ? 'win' : 'loss';
          return `
            <tr>
              <td>${date}</td>
              <td>${opponent}</td>
              <td>${score}</td>
              <td class="${resultClass}">${result}</td>
            </tr>
          `;
        }).join('');
      })
      .catch((err) => {
        console.error('Failed to load match history', err);
        if (matchHistoryBody) {
          matchHistoryBody.innerHTML = '<tr><td colspan="4" style="color:#ef4444; text-align:center; padding:14px;">Failed to load match history</td></tr>';
        }
      });

    // Presence polling (every ~20s)
    refreshPresence();
    const presenceInterval = setInterval(refreshPresence, 20_000);
    const stopPresence = () => clearInterval(presenceInterval);
    window.addEventListener('hashchange', stopPresence, { once: true });

    // Add Friend
    const addFriendBtn = document.getElementById('add-friend-btn') as HTMLButtonElement | null;
    addFriendBtn?.addEventListener('click', async () => {
      if (!userId) {
        alert('Cannot add friend: User ID not found');
        return;
      }
      try {
        const usernameEl = document.getElementById('profile-username');
        const username = usernameEl?.textContent;
        if (!username || username === 'Loading…' || username === 'User not found') {
          alert('Cannot add friend: Username not available');
          return;
        }
        await api.sendFriendRequest({ username });
        alert('Friend request sent successfully!');
        if (addFriendBtn) {
          addFriendBtn.textContent = 'Request Sent';
          addFriendBtn.disabled = true;
        }
      } catch (error: any) {
        console.error('Failed to send friend request:', error);
        alert(`Failed to send friend request: ${error.message}`);
      }
    });
  }, 0);
}
