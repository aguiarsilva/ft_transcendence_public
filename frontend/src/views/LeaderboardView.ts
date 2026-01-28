import { session } from '@/state/session';
import { api } from '@/api/client';
import type { LeaderboardEntry } from '@/api/types';

export function LeaderboardView() {
  if (!session.isAuthenticated()) {
    location.hash = '#/login';
  }

  return `
    <div class="page-background">
      <div class="main-wrapper">
        
        <!-- Header -->
        <header class="header">
          <div class="logo">🏆 Leaderboard</div>
          <div class="top-buttons">
            <a href="#/dashboard" class="header-btn">🏠 Dashboard</a>
            <button class="header-btn logout" id="logout-btn">⎋ Logout</button>
          </div>
        </header>

        <!-- Leaderboard Content -->
        <div class="leaderboard-container">
          <h1 class="leaderboard-title">Leaderboard</h1>
          <p class="leaderboard-subtitle">Top players</p>

          <div class="table-wrap">
            <div class="leaderboard-card">
              <table class="leaderboard-table" aria-label="Leaderboard table">
                <thead>
                  <tr>
                    <th scope="col" class="col-rank">Rank</th>
                    <th scope="col" class="col-player">Player</th>
                    <th scope="col" class="col-points">Points</th>
                    <th scope="col" class="col-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="4" style="text-align:center; color:#64748b; padding:16px;">Loading…</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}

export function initLeaderboardHandlers() {
  setTimeout(() => {
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', () => {
      session.clear();
      window.location.hash = '#/login';
    });

    const tbody = document.querySelector('.leaderboard-table tbody') as HTMLTableSectionElement | null;
    if (!tbody) return;

    // Determine current user ID (from JWT or sessionStorage fallback)
    let myUserId: number | null = null;
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        myUserId = Number(payload.sub);
      } catch {}
    }
    if (!myUserId) {
      try {
        const sessionUser = JSON.parse(sessionStorage.getItem('user') || 'null');
        if (sessionUser?.id) myUserId = Number(sessionUser.id);
      } catch {}
    }

    api.getLeaderboard(25, 0)
      .then((rows: LeaderboardEntry[]) => {
        if (!rows || rows.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:16px;">No data</td></tr>';
          return;
        }

        tbody.innerHTML = rows.map((player) => {
          const pts = new Intl.NumberFormat().format(player.pointsTotal);
          const isSelf = myUserId != null && player.userId === myUserId;

          // If it's your own row, hide the button (or render a disabled placeholder)
          const actionHtml = isSelf
            ? '<span style="color:#94a3b8;"></span>' // or 'Your profile'
            : `<button class="btn small warm view-profile-btn" data-user-id="${player.userId}">View Profile</button>`;

          return `
            <tr>
              <td><span class="rank-badge ${player.rank > 3 ? 'alt' : ''}">${player.rank}</span></td>
              <td class="player-cell"><span class="player-name">${player.username}</span></td>
              <td class="points">${pts}</td>
              <td class="action">
                ${actionHtml}
              </td>
            </tr>
          `;
        }).join('');
      })
      .catch((err) => {
        console.error('Failed to load leaderboard', err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444; padding:16px;">Failed to load</td></tr>';
      });

    tbody.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.view-profile-btn') as HTMLElement | null;
      if (!btn) return;
      const userId = btn.getAttribute('data-user-id');
      if (!userId) return;
      window.location.hash = `#/user/${userId}`;
    });
  }, 0);
}
