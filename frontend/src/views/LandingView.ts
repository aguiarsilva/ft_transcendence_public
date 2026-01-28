import { session } from '@/state/session';
import { setForcedMode } from '@/state/gameMode';

export function LandingView() {
  const user = session.user();
  const playLabel = user ? 'Play Now' : 'Play Now';
  const authLabel = user ? 'Dashboard' : 'Login / Register';
  const playHref = '#/game';
  const authHref = user ? '#/dashboard' : '#/login';

  return `
    <div class="landing-wrapper min-h-screen flex flex-col">
      <!-- Header -->
      <header class="landing-header py-3 px-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img src="/game/textures/logo.png" alt="Wolfsburg Logo" class="h-9 w-auto" />
            <span class="font-bold text-slate-900 text-lg" style="letter-spacing: 1px;">Wolfsburg</span>
          </div>
          <nav>
            <a href="#/about" class="landing-nav-link text-slate-700 hover:text-slate-900 font-semibold text-base px-3 py-2 inline-block">About</a>
          </nav>
        </div>
      </header>

      <!-- MODE SELECT MODAL -->
     <div id="mode-modal" class="mode-modal hidden">
      <div class="mode-backdrop"></div>

      <div class="mode-window">
        <h2>Select Game Mode</h2>

        <button id="modal-1v1" class="mode-btn">Play 1v1</button>
        <button id="modal-ai" class="mode-btn">Play vs AI</button>

      <button id="modal-close" class="mode-close">Close</button>
      </div>
    </div>


      <!-- Hero Section -->
      <main class="flex-1 flex flex-col items-center justify-center px-6 py-12" style="padding-top: 96px;">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-5xl md:text-7lg font-black text-slate-900 mb-6" style="letter-spacing: 2px; font-weight: 800; line-height: 1.2; color: #0f172a;">
            TRANSCENDENCE<br/><span style="color: #334155;">PONG 3D</span>
          </h1>
          <p class="text-lg md:text-lg mb-10 max-w-2lg mx-auto" style="color: #64748b; font-weight: 400; line-height: 1.6;">
            Play Pong with AI, friends right on your keyboard or register to join exciting tournaments!
          </p>
          
          <!-- CTA Buttons -->
          <div class="flex flex-wrap items-center justify-center gap-5 mb-10">
          <button id="open-mode-modal" class="landing-btn landing-btn-primary px-8 py-3.5 text-white font-semibold rounded-xl">
            ${playLabel}
          </button>

            <a href="${authHref}" class="landing-btn px-8 py-3.5 bg-slate-600 text-white font-semibold rounded-xl">
              ${authLabel}
            </a>
          </div>

          <!-- 3D Pong Table Visual -->
          <div class="relative max-w-4xl mx-auto">
            <img 
              src="/game/textures/playground1.png" 
              alt="3D Pong Playground" 
              class="landing-table-img w-full h-auto rounded-2xl shadow-2xl cursor-pointer"
            />
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="py-8 px-6 mt-12 border-t border-gray-500/30">
        <div class="max-w-7xl mx-auto text-center">
          <p class="text-slate-600 text-sm mb-4">© ${new Date().getFullYear()} Transcendence Pong 3D. All rights reserved.</p>
          <div class="flex items-center justify-center gap-6">
            <a href="https://www.linkedin.com/in/dansamuel" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="landing-social-link w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center" style="background: #0A66C2; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="w-7 h-7">
                <rect width="24" height="24" rx="4" fill="#0A66C2"></rect>
                <path d="M7 8.5h2v9H7zM8 7.2a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3zM11.5 8.5h2v1.3c.3-.6 1.1-1.4 2.6-1.4 2.1 0 3.4 1.2 3.4 3.7v5.4h-2v-5c0-1.5-.5-2.3-1.7-2.3-1 0-1.6.7-1.9 1.4-.1.2-.1.5-.1.8v5.1h-2v-9z" fill="#fff"></path>
              </svg>
            </a>
            <a href="https://www.linkedin.com/in/daguiarsilva" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="landing-social-link w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center" style="background: #0A66C2; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="w-7 h-7">
                <rect width="24" height="24" rx="4" fill="#0A66C2"></rect>
                <path d="M7 8.5h2v9H7zM8 7.2a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3zM11.5 8.5h2v1.3c.3-.6 1.1-1.4 2.6-1.4 2.1 0 3.4 1.2 3.4 3.7v5.4h-2v-5c0-1.5-.5-2.3-1.7-2.3-1 0-1.6.7-1.9 1.4-.1.2-.1.5-.1.8v5.1h-2v-9z" fill="#fff"></path>
              </svg>
            </a>
            <a href="https://www.linkedin.com/in/stefan-penev/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="landing-social-link w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center" style="background: #0A66C2; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="w-7 h-7">
                <rect width="24" height="24" rx="4" fill="#0A66C2"></rect>
                <path d="M7 8.5h2v9H7zM8 7.2a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3zM11.5 8.5h2v1.3c.3-.6 1.1-1.4 2.6-1.4 2.1 0 3.4 1.2 3.4 3.7v5.4h-2v-5c0-1.5-.5-2.3-1.7-2.3-1 0-1.6.7-1.9 1.4-.1.2-.1.5-.1.8v5.1h-2v-9z" fill="#fff"></path>
              </svg>
            </a>
            <a href="https://www.linkedin.com/in/anna-ilchenko-3d" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="landing-social-link w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center" style="background: #0A66C2; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="w-7 h-7">
                <rect width="24" height="24" rx="4" fill="#0A66C2"></rect>
                <path d="M7 8.5h2v9H7zM8 7.2a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3zM11.5 8.5h2v1.3c.3-.6 1.1-1.4 2.6-1.4 2.1 0 3.4 1.2 3.4 3.7v5.4h-2v-5c0-1.5-.5-2.3-1.7-2.3-1 0-1.6.7-1.9 1.4-.1.2-.1.5-.1.8v5.1h-2v-9z" fill="#fff"></path>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  `;
}

export function initLandingHandlers() {
   const playBtn = document.getElementById("open-mode-modal");
  const modal = document.getElementById("mode-modal");
  const closeBtn = document.getElementById("modal-close");

  if (!playBtn || !modal || !closeBtn) {
    console.error("modal elements missing");
    return;
  }

  playBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  document.getElementById("modal-1v1")?.addEventListener("click", () => {
    console.log('Play 1v1 clicked, setting mode to 1v1');
    setForcedMode('1v1');
    window.location.hash = '#/game';
  });

  document.getElementById("modal-ai")?.addEventListener("click", () => {
    console.log('Play AI clicked, setting mode to ai');
    setForcedMode('ai');
    window.location.hash = '#/game';
  });
}
