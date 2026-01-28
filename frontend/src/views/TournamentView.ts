import { session } from '@/state/session';
import { api } from '@/api/client';
import type { Tournament, TournamentNextMatch, TournamentParticipantsSummary } from '@/api/types';
import { showAnnouncementModal, showTournamentWinnersModal } from '@/views/AnnouncementView';
import { setForcedMode, setForcedTournamentId, getForcedTournamentId } from '@/state/gameMode';

export function TournamentView() {
  const user = session.user();
  return `
  <div class="page-background tournament-page">
    <div class="main-wrapper">

      <header class="top-bar">
        <div class="logo">TRANSCENDENCE TOURNAMENT</div>
        <div class="bar-actions">
          <a href="#/dashboard" class="btn dashboard">Dashboard</a>
        </div>
      </header>

      <div class="layout-grid">

        <!-- Combined Active Tournament + Next Match -->
        <section class="panel status-panel">
          <h2 class="panel-title">
            Active Tournament
            <span class="pill pill-neutral" id="activeStatus">ACTIVE</span>
          </h2>

          <div class="panel-body status-body">
            <div class="active-box" id="activeTournament">
              <div class="active-line">
                <span class="active-label">No active tournament</span>
              </div>
            </div>

            <div class="status-sep"></div>

            <div class="next-match-block">
              <h3 class="subheading">Next Match</h3>
              <div class="ring">
                <div class="ring-inner"></div>
                <div class="ring-info">
                  <div class="match-vs" id="matchVs">Waiting for match</div>
                  <div class="match-time" id="matchTime">--:--</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- Orb / creation panel -->
        <section class="panel orb-panel">
          <h2 class="panel-title">Pong Arena</h2>
          <div class="panel-body">
            <div class="orb-wrapper">

              ${user ? `
                <form class="tourn-form" id="createTournamentForm">
                  <div class="form-row">
                    <label class="field-label" for="tournName">Tournament name</label>
                    <input id="tournName" name="tournName" type="text" class="text-input" placeholder="Enter name" required minlength="1">
                  </div>

                  <div class="form-row">
                    <label class="field-label" for="playerCount">Players</label>
                    <select id="playerCount" name="playerCount" class="player-count-select">
                      <option value="" disabled selected>Select</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                    </select>
                  </div>
                </form>

                <button type="button" id="createTournamentOrb" class="orb" aria-label="Create tournament">
                  <span class="orb-text">Create Tournament</span>
                </button>
              ` : `
                <div class="login-prompt">
                  <p>Please log in to create or join tournaments</p>
                  <a href="#/login" class="btn primary">Login</a>
                </div>
              `}

            </div>
          </div>
        </section>

        <!-- Waiting tournaments -->
        <section class="panel tournaments">
          <h2 class="panel-title">Tournaments Waiting for Players</h2>
          <div class="panel-body">
            <div class="list" id="tournament-list">
              <div class="list-item empty">Loading tournaments...</div>
            </div>
          </div>
        </section>

      </div> <!-- END layout-grid -->
    </div> <!-- END main-wrapper -->
  </div> <!-- END page-background -->
`;
}

async function debugBracket(id: number) {
  try {
    const data = await api.getTournamentBracket(id);
    console.log("=== TOURNAMENT BRACKET ===");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Bracket load error:", err);
  }
}

let tournamentHandlersController: AbortController | null = null;

export async function initTournamentHandlers() {

  console.log("initTournamentHandlers called")
  const tournamentId = getForcedTournamentId();

  // if after the game, check tournament status
  if (tournamentId) {
    debugBracket(tournamentId);
    const next = await api.getTournamentNextMatch(tournamentId);
    const nextMatch = next.nextMatch;

    if (!nextMatch) {
      console.log("TOURNAMENT FINISHED");
      debugBracket(tournamentId);
      const winners = next.winners ?? [];
      const winnersWithAlias = winners
        .filter(w => w.alias !== null)
        .map(w => ({ place: w.place, alias: w.alias! }));
      showTournamentWinnersModal(winnersWithAlias);
      //showTournamentWinners(winners);
    } else {
      console.log(nextMatch?.status);
      const p1 = nextMatch?.player1?.alias || 'PLAYER 1';
      const p2 = nextMatch?.player2?.alias || 'PLAYER 2';
      showAnnouncementModal({
        player1: p1,
        player2: p2,
        onStart: () => window.location.hash = "#/game"
      });
    }
  }

  // Prevent duplicate bindings
  if (tournamentHandlersController) {
    tournamentHandlersController.abort();
  }
  tournamentHandlersController = new AbortController();
  const { signal } = tournamentHandlersController;

  loadTournamentList();

  const createForm = document.getElementById('createTournamentForm') as HTMLFormElement | null;
  const createOrb = document.getElementById('createTournamentOrb') as HTMLButtonElement | null;
  const tournName = document.getElementById('tournName') as HTMLInputElement | null;
  const playerCount = document.getElementById('playerCount') as HTMLSelectElement | null;

  if (createOrb && createForm && tournName && playerCount) {
    createOrb.addEventListener('click', async () => {
      if (!createForm.checkValidity()) return createForm.reportValidity();

      try {
        const name = tournName.value.trim();
        if (!name) return alert('Tournament name is required');

        createOrb.disabled = true;
        await api.createTournament({
          name,
          maxPlayers: playerCount.value ? parseInt(playerCount.value) : 8
        });
        createForm.reset();
        await loadTournamentList();
      } catch (err) {
        console.error('Error creating tournament:', err);
        alert(err instanceof Error ? err.message : 'Failed to create tournament');
      } finally {
        createOrb.disabled = false;
      }
    }, { signal });
  }

  // Delegate action buttons with guard against double-clicks
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const joinBtn = target.closest('.join-btn') as HTMLButtonElement | null;
    const startBtn = target.closest('.start-btn') as HTMLButtonElement | null;
    const cancelBtn = target.closest('.cancel-btn') as HTMLButtonElement | null;

    // Continue button in active tournament panel
    if (target.id === 'continueTournamentBtn' && target instanceof HTMLButtonElement) {
      const id = target.dataset.id;
      if (!id) return;
      try {
        // Call the endpoint to get the next match
        const next = await api.getTournamentNextMatch(Number(id));
        if (next.nextMatch) {
          const p1 = next.nextMatch.player1?.alias || 'PLAYER 1';
          const p2 = next.nextMatch.player2?.alias || 'PLAYER 2';
          showAnnouncementModal({
            player1: p1,
            player2: p2,
            onStart: () => {
              setForcedMode('tournament');
              setForcedTournamentId(Number(id));
              window.location.hash = '#/game';
            }
          });
        } else {
          alert('No more matches to play.');
        }
      } catch (err) {
        alert('Failed to get next match');
      }
      return;
    }

    if (target.id === 'cancelActiveTournamentBtn' && target instanceof HTMLButtonElement) {
      const id = target.dataset.id;
      if (!id) return;
      try {
        target.disabled = true;
        await api.cancelTournament(Number(id));
        await loadTournamentList();
      } catch (err) {
        alert('Failed to cancel tournament');
      } finally {
        target.disabled = false;
      }
      return;
    }

    if (joinBtn && !joinBtn.disabled) {
      const tournamentId = joinBtn.dataset.id;
      if (!tournamentId) return;
      try {
        joinBtn.disabled = true;
        await api.registerTournamentParticipant(parseInt(tournamentId));
        await loadTournamentList();
      } catch (err) {
        console.error('Error joining tournament:', err);
        alert('Failed to join tournament');
      } finally {
        joinBtn.disabled = false;
      }
    }

    if (startBtn && !startBtn.disabled) {
      const tournamentId = startBtn.dataset.id;
      if (!tournamentId) return;
      try {
        startBtn.disabled = true;
        const id = parseInt(tournamentId);

        const participants = await api.listTournamentParticipants(id).catch(() => []);
        const player1 = participants[0]?.alias || 'PLAYER 1';
        const player2 = participants[1]?.alias || 'PLAYER 2';

        showAnnouncementModal({
          player1,
          player2,
          onStart: async () => {
            console.log("showAnnouncementModal called");
            const summary = await api.getTournamentParticipantsSummary(id).catch(() => null);
            const joinedCount = summary?.joinedCount ?? 0;
            if (joinedCount < 3) {
              alert('Need at least 3 participants to start');
              return;
            }
            await api.seedTournament(id);
            debugBracket(id);
            setForcedMode('tournament');
            setForcedTournamentId(id);
            window.location.hash = '#/game';
          },
        });

        await loadTournamentList();
      } catch (err) {
        console.error('Error starting tournament:', err);
        alert(err instanceof Error ? err.message : 'Failed to start tournament');
      } finally {
        startBtn.disabled = false;
      }
    }

    if (cancelBtn && !cancelBtn.disabled && cancelBtn.id !== 'cancelActiveTournamentBtn') {
      const tournamentId = cancelBtn.dataset.id;
      if (!tournamentId) return;
      try {
        cancelBtn.disabled = true;
        await api.cancelTournament(parseInt(tournamentId));
        await loadTournamentList();
      } catch (err) {
        console.error('Error canceling tournament:', err);
        alert('Failed to cancel tournament');
      } finally {
        cancelBtn.disabled = false;
      }
    }
  }, { signal });
}

export function cleanupTournamentView() {
  if (tournamentHandlersController) {
    tournamentHandlersController.abort();
    tournamentHandlersController = null;
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function generateTournamentItem(
  t: Tournament,
  summary: TournamentParticipantsSummary | null,
  user: any,
  isJoined: boolean
): string {
  const isHost = user && t.createdByUser?.id === user.id;

  let actionButtons = '';
  const joinedCount = summary?.joinedCount ?? 0;
  const canStart = joinedCount >= 3;

  if (isHost) {
    const startAttrs = canStart
      ? 'class="start-btn"'
      : 'class="start-btn is-disabled" aria-disabled="true"';

    const startTitle = canStart
      ? ''
      : ' title="Need at least 3 participants to start"';

    actionButtons =
      '<button ' + startAttrs + startTitle + ' type="button" data-id="' + t.id + '">Start</button>' +
      '<button class="cancel-btn" type="button" data-id="' + t.id + '">Cancel</button>';
  } else if (user && !isJoined) {
    actionButtons = '<button class="join-btn" type="button" data-id="' + t.id + '">Join</button>';
  }

  const maxPlayers = summary?.maxPlayers ?? t.maxPlayers;
  const maxLabel = maxPlayers == null ? '?' : String(maxPlayers);

  return '<div class="list-item joinable"><div class="list-info"><div class="l-name">' + t.name + '</div><div class="l-meta">Slots: ' + joinedCount + ' / ' + maxLabel + ' players</div></div><div class="list-actions">' + actionButtons + '</div></div>';
}

async function loadTournamentList() {
  const el = document.getElementById("tournament-list");
  if (!el) return;

  try {
    const tournaments = await api.getTournaments();
    const user = session.user();

    if (!tournaments || tournaments.length === 0) {
      el.innerHTML = `
        <div class="list-item empty">
          No tournaments available. Be the first to create one!
        </div>
      `;
      return;
    }

    const summaries = await Promise.all(
      tournaments.map((t) => api.getTournamentParticipantsSummary(t.id).catch(() => null))
    );

    // Check for active tournament
    const activeTournament =
      tournaments.find((t) => t.status === 'IN_PROGRESS') ||
      tournaments.find((t) => t.status === 'REGISTERING');

    const activeSummary = activeTournament
      ? await api.getTournamentParticipantsSummary(activeTournament.id).catch(() => null)
      : null;

    const nextOrWinners = activeTournament
      ? await api.getTournamentNextMatch(activeTournament.id).catch(() => null)
      : null;

    await updateActiveTournament(activeTournament, activeSummary, nextOrWinners?.nextMatch ?? null);

    // Filter waiting tournaments
    const waitingTournaments = tournaments.filter((t) => t.status === 'REGISTERING');

    if (waitingTournaments.length === 0) {
      el.innerHTML = `
        <div class="list-item empty">
          No tournaments waiting for players. Create one to get started!
        </div>
      `;
      return;
    }

    const joinedByTournamentId = new Map<number, boolean>();

    if (user) {
      const participantsLists = await Promise.all(
        waitingTournaments.map((t) => api.listTournamentParticipants(t.id).catch(() => []))
      );

      for (let i = 0; i < waitingTournaments.length; i++) {
        const t = waitingTournaments[i];
        const list = participantsLists[i] ?? [];
        joinedByTournamentId.set(
          t.id,
          list.some((p) => p.userId === user.id)
        );
      }
    }

    el.innerHTML = waitingTournaments
      .map((t) => {
        const s = summaries.find((x) => x?.tournamentId === t.id) ?? null;
        const joined = joinedByTournamentId.get(t.id) ?? false;
        return generateTournamentItem(t, s, user, joined);
      })
      .join("");

  } catch (err) {
    console.error('Error loading tournaments:', err);
    el.innerHTML = `
      <div class="list-item error">
        Failed to load tournaments. Please try again later.
      </div>
    `;
  }
}

async function updateActiveTournament(
  tournament: Tournament | undefined,
  summary: TournamentParticipantsSummary | null,
  nextMatch: TournamentNextMatch
) {
  const activeTournamentEl = document.getElementById('activeTournament');
  const statusPill = document.getElementById('activeStatus');
  const matchVsEl = document.getElementById('matchVs');
  const matchTimeEl = document.getElementById('matchTime');
  const user = session.user();

  if (!activeTournamentEl || !statusPill) return;

  if (!tournament) {
    activeTournamentEl.innerHTML = `
      <div class="active-line">
        <span class="active-label">No active tournament</span>
      </div>
    `;
    statusPill.textContent = 'INACTIVE';
    statusPill.className = 'pill pill-neutral';
    if (matchVsEl) matchVsEl.textContent = 'Waiting for match';
    if (matchTimeEl) matchTimeEl.textContent = '--:--';
    return;
  }

  // Fetch participants to check permissions
  const participants = await api.listTournamentParticipants(tournament.id).catch(() => []);

  // Only show details to creator or participants
  const isCreator = user && tournament.createdByUser?.id === user.id;
  const isParticipant = user && participants.some((p: any) => p.userId === user.id);

  if (!isCreator && !isParticipant) {
    activeTournamentEl.innerHTML = `<div class="active-line"><span class="active-label">No active tournaments.</span></div>`;
    statusPill.textContent = 'INACTIVE';
    statusPill.className = 'pill pill-neutral';
    if (matchVsEl) matchVsEl.textContent = '--';
    if (matchTimeEl) matchTimeEl.textContent = '--';
    return;
  }

  // Update status pill
  if (tournament.status === 'IN_PROGRESS') {
    statusPill.textContent = 'IN PROGRESS';
  } else if (tournament.status === 'REGISTERING') {
    statusPill.textContent = 'ACTIVE';
  } else {
    statusPill.textContent = tournament.status;
  }
  statusPill.className = 'pill pill-neutral';

  // Add Continue and Cancel buttons (only for creator and only if IN_PROGRESS)
  let buttonsHtml = '';
  if (isCreator && tournament.status === 'IN_PROGRESS') {
    buttonsHtml = `
      <div class="active-actions" style="margin-top: 1em; display: flex; gap: 0.5em; flex-wrap: wrap;">
        <button class="btn btn-sm continue-btn" id="continueTournamentBtn" type="button" data-id="${tournament.id}" style="flex:1 1 0; min-width:90px; max-width:160px;">Continue</button>
        <button class="btn btn-sm cancel-btn" id="cancelActiveTournamentBtn" type="button" data-id="${tournament.id}" style="flex:1 1 0; min-width:90px; max-width:160px;">Cancel</button>
      </div>
    `;
  }

  // Update tournament info
  activeTournamentEl.innerHTML = `
    <div class="active-line">
      <span class="active-label">Tournament</span>
      <span class="active-value">${tournament.name}</span>
    </div>
    <div class="active-line">
      <span class="active-label">Host</span>
      <span class="active-value">@${tournament.createdByUser?.username || 'unknown'}</span>
    </div>
    <div class="active-line">
      <span class="active-label">Players</span>
      <span class="active-value">${summary?.joinedCount ?? 0} / ${summary?.maxPlayers ?? tournament.maxPlayers ?? '?'}</span>
    </div>
    <div class="active-line">
      <span class="active-label">Started</span>
      <span class="active-value">${formatDate(tournament.startedAt || tournament.createdAt)}</span>
    </div>
    ${buttonsHtml}
  `;

  // Update next match
  if (matchVsEl && matchTimeEl) {
    if (tournament.status === 'IN_PROGRESS' && nextMatch && nextMatch.player1 && nextMatch.player2) {
      matchVsEl.textContent = `${nextMatch.player1.alias} vs ${nextMatch.player2.alias}`;
      matchTimeEl.textContent = 'Starting soon';
    } else {
      matchVsEl.textContent = 'Waiting for match';
      matchTimeEl.textContent = '--:--';
    }
  }

  // Show winners modal if tournament is finished and user is creator or participant
  if ((isCreator || isParticipant) && tournament.status === 'FINISHED') {
    try {
      const nextOrWinners = await api.getTournamentNextMatch(tournament.id);
      const winners = nextOrWinners.winners ?? [];
      if (winners.length > 0) {
        const winnersWithAlias = winners
          .filter(w => w.alias !== null)
          .map(w => ({ place: w.place, alias: w.alias! }));
        showTournamentWinnersModal(winnersWithAlias);
      }
    } catch (err) {
      // Optionally handle error
    }
  }
}