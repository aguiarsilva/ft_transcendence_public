import { setForcedMode, setForcedTournamentId, } from '@/state/gameMode';


export type AnnouncementModalOptions = {
  player1: string;
  player2: string;
  onStart?: () => void;
};

export function renderAnnouncementModal(opts: AnnouncementModalOptions): string {
  return `
    <div class="announcement-modal-overlay" role="dialog" aria-modal="true">
      <div class="announcement-modal">
        <div class="match-container">
          <div class="players-circle">
            <span>${opts.player1}</span>
            <span>VS</span>
            <span>${opts.player2}</span>
          </div>

          <button class="start-btn" id="announcement-start-btn" type="button">START</button>

          <div class="thin-line"></div>

          <h3 class="controls-title">CONTROLS</h3>

          <div class="controls-wrapper">
            <div class="player-box">
              <h2>PLAYER 1</h2>

              <div class="keys player1-layout">
                <div class="key">W</div>
                <div class="key-row">
                  <div class="key">A</div>
                  <div class="key">S</div>
                  <div class="key">D</div>
                </div>
              </div>

              <p class="control-label big">ESC – PAUSE </p>
            </div>

            <div class="divider"></div>

            <div class="player-box">
              <h2>PLAYER 2</h2>

              <div class="keys player2-layout">
                <div class="key">↑</div>
                <div class="key-row">
                  <div class="key">←</div>
                  <div class="key">↓</div>
                  <div class="key">→</div>
                </div>
              </div>

              <p class="control-label big">SPACE – PAUSE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function hideAnnouncementModal() {
  const existing = document.getElementById('announcement-modal-root');
  if (existing) existing.remove();
}

export function showAnnouncementModal(opts: AnnouncementModalOptions) {
  hideAnnouncementModal();

  const root = document.createElement('div');
  root.id = 'announcement-modal-root';
  root.innerHTML = renderAnnouncementModal(opts);
  document.body.appendChild(root);

  const startBtn = document.getElementById('announcement-start-btn');
  startBtn?.addEventListener('click', () => {
    hideAnnouncementModal();
    opts.onStart?.();
  });

  const overlay = root.querySelector('.announcement-modal-overlay');
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) hideAnnouncementModal();
  });
}

export function renderWinnerModal(
  winners: { place: number; alias: string }[]
): string {
  return `
    <div class="announcement-modal-overlay" role="dialog" aria-modal="true">
      <div class="announcement-modal">
        <div class="match-container">

          <h2 class="winner-title">Tournament Finished!</h2>
          <p class="winner-subtitle">Final Standings:</p>

          <div class="winner-list">
            ${winners
              .map(
                w => `
              <div class="winner-item ${w.place === 1 ? "first" : "second"}">
                ${w.place === 1 ? "🥇" : "🥈"} ${w.alias}
              </div>`
              )
              .join("")}
          </div>

          <button class="start-btn winner-btn" id="winner-back-btn">
            BACK TO DASHBOARD
          </button>

        </div>
      </div>
    </div>
  `;
}


export function showTournamentWinnersModal(
  winners: { place: number; alias: string }[]
) {
  hideAnnouncementModal(); // удалить предыдущую

  const root = document.createElement("div");
  root.id = "announcement-modal-root";
  root.innerHTML = renderWinnerModal(winners);
  document.body.appendChild(root);

  const backBtn = document.getElementById("winner-back-btn");
  backBtn?.addEventListener("click", () => {
    hideAnnouncementModal();
    setForcedTournamentId(0);
    setForcedMode("ai");
    window.location.hash = "#/dashboard";
  });
}
