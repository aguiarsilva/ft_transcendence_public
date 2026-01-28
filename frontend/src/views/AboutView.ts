export function AboutView() {
  return `
    <div class="landing-wrapper min-h-screen flex flex-col" style="background: linear-gradient(to bottom, #f8fafc 0%, #d9eafd 35%, #bcccdc 70%, #9aa6b2 100%);">
      <!-- Header -->
      <header class="landing-header py-3 px-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img src="/game/textures/logo.png" alt="Wolfsburg Logo" class="h-9 w-auto" />
            <span class="font-bold text-slate-900 text-lg" style="letter-spacing: 1px;">Wolfsburg</span>
          </div>
          <nav class="flex items-center gap-4">
            <a href="#/" class="landing-nav-link text-slate-700 hover:text-slate-900 font-semibold text-base px-3 py-2 inline-block">Home</a>
            <button id="team-panel-btn" class="landing-nav-link text-slate-700 hover:text-slate-900 font-semibold text-base px-3 py-2 inline-block bg-transparent border-none cursor-pointer">Team</button>
          </nav>
        </div>
      </header>

      <!-- About Content -->
      <main class="flex-1 flex flex-col items-center justify-start px-6 py-12" style="padding-top: 120px; padding-bottom: 60px;">
        <div class="about-content max-w-3xl mx-auto" style="background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(8px); border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);">
          <h1 class="text-4xl font-bold text-slate-900 mb-3">About Transcendence Pong 3D</h1>
          <h2 class="text-xl font-medium text-slate-600 mb-8">Bringing a timeless classic into a new dimension.</h2>
          <p class="text-base text-slate-700 leading-relaxed mb-6">
            Transcendence Pong 3D is a modern reimagining of the legendary arcade game Pong — 
            developed as part of the ft_transcendence project within the 42 school network.
          </p>

          <div class="divider" style="height: 4px; width: 50px; background-color: #2563eb; border-radius: 2px; margin: 30px 0;"></div>

          <h3 class="text-xl font-semibold text-slate-900 mt-10 mb-4">Key Features</h3>
          <ul class="list-disc pl-6 space-y-2 text-slate-700">
            <li><strong>Play Modes:</strong> AI, Local Multiplayer, and Tournaments</li>
            <li><strong>3D Gameplay:</strong> A visually enhanced version of the classic Pong experience</li>
            <li><strong>Real-Time Matches:</strong> Compete live with players on the same keyboard</li>
          </ul>

          <h3 class="text-xl font-semibold text-slate-900 mt-10 mb-4">Credits</h3>
          <p class="text-base text-slate-700 leading-relaxed">
            Developed by students of 42 Wolfsburg as part of the ft_transcendence project.
          </p>
        </div>
      </main>

      <!-- Footer -->
      <footer class="py-8 px-6 mt-12 border-t border-gray-500/30">
        <div class="max-w-7xl mx-auto text-center">
          <p class="text-slate-600 text-sm mb-4">© ${new Date().getFullYear()} Transcendence Pong 3D. All rights reserved.</p>
          <div class="flex items-center justify-center gap-6">
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="landing-social-link w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center" style="background: #0A66C2; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="w-7 h-7">
                <rect width="24" height="24" rx="4" fill="#0A66C2"></rect>
                <path d="M7 8.5h2v9H7zM8 7.2a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3zM11.5 8.5h2v1.3c.3-.6 1.1-1.4 2.6-1.4 2.1 0 3.4 1.2 3.4 3.7v5.4h-2v-5c0-1.5-.5-2.3-1.7-2.3-1 0-1.6.7-1.9 1.4-.1.2-.1.5-.1.8v5.1h-2v-9z" fill="#fff"></path>
              </svg>
            </a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="landing-social-link w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center" style="background: #0A66C2; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="w-7 h-7">
                <rect width="24" height="24" rx="4" fill="#0A66C2"></rect>
                <path d="M7 8.5h2v9H7zM8 7.2a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3zM11.5 8.5h2v1.3c.3-.6 1.1-1.4 2.6-1.4 2.1 0 3.4 1.2 3.4 3.7v5.4h-2v-5c0-1.5-.5-2.3-1.7-2.3-1 0-1.6.7-1.9 1.4-.1.2-.1.5-.1.8v5.1h-2v-9z" fill="#fff"></path>
              </svg>
            </a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="landing-social-link w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center" style="background: #0A66C2; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="w-7 h-7">
                <rect width="24" height="24" rx="4" fill="#0A66C2"></rect>
                <path d="M7 8.5h2v9H7zM8 7.2a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3zM11.5 8.5h2v1.3c.3-.6 1.1-1.4 2.6-1.4 2.1 0 3.4 1.2 3.4 3.7v5.4h-2v-5c0-1.5-.5-2.3-1.7-2.3-1 0-1.6.7-1.9 1.4-.1.2-.1.5-.1.8v5.1h-2v-9z" fill="#fff"></path>
              </svg>
            </a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" class="landing-social-link w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center" style="background: #0A66C2; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
              <svg viewBox="0 0 24 24" aria-hidden="true" class="w-7 h-7">
                <rect width="24" height="24" rx="4" fill="#0A66C2"></rect>
                <path d="M7 8.5h2v9H7zM8 7.2a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3zM11.5 8.5h2v1.3c.3-.6 1.1-1.4 2.6-1.4 2.1 0 3.4 1.2 3.4 3.7v5.4h-2v-5c0-1.5-.5-2.3-1.7-2.3-1 0-1.6.7-1.9 1.4-.1.2-.1.5-.1.8v5.1h-2v-9z" fill="#fff"></path>
              </svg>
            </a>
          </div>
        </div>
      </footer>

      <!-- Team Side Panel -->
      <div id="team-panel" class="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform translate-x-full transition-transform duration-300 ease-in-out z-50" style="box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);">
        <div class="h-full flex flex-col">
          <!-- Panel Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 class="text-2xl font-bold text-slate-900">Our Team</h2>
            <button id="close-panel-btn" class="text-slate-600 hover:text-slate-900 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              ×
            </button>
          </div>
          
          <!-- Panel Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <div class="space-y-6">
              <!-- Developer 1 -->
              <div class="team-member flex flex-col items-center text-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-lg transition-shadow">
                <div class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg">
                  S
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-1">Stefan</h3>
                <p class="text-sm text-slate-600">Backend</p>
              </div>

              <!-- Developer 2 -->
              <div class="team-member flex flex-col items-center text-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-lg transition-shadow">
                <div class="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg">
                  D
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-1">Daniel</h3>
                <p class="text-sm text-slate-600">Frontend</p>
              </div>

              <!-- Developer 3 -->
              <div class="team-member flex flex-col items-center text-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-lg transition-shadow">
                <div class="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg">
                  A
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-1">Anna</h3>
                <p class="text-sm text-slate-600">Game</p>
              </div>

              <!-- Developer 4 -->
              <div class="team-member flex flex-col items-center text-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-lg transition-shadow">
                <div class="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg">
                  B
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-1">Bruno</h3>
                <p class="text-sm text-slate-600">DevOps</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Overlay -->
      <div id="panel-overlay" class="fixed inset-0 bg-black bg-opacity-50 opacity-0 pointer-events-none transition-opacity duration-300 z-40"></div>
    </div>
  `;
}

export function initAboutHandlers() {
  const teamPanelBtn = document.getElementById('team-panel-btn');
  const closePanelBtn = document.getElementById('close-panel-btn');
  const teamPanel = document.getElementById('team-panel');
  const overlay = document.getElementById('panel-overlay');

  function openPanel() {
    if (teamPanel && overlay) {
      teamPanel.classList.remove('translate-x-full');
      teamPanel.classList.add('translate-x-0');
      overlay.classList.remove('opacity-0', 'pointer-events-none');
      overlay.classList.add('opacity-100');
    }
  }

  function closePanel() {
    if (teamPanel && overlay) {
      teamPanel.classList.remove('translate-x-0');
      teamPanel.classList.add('translate-x-full');
      overlay.classList.remove('opacity-100');
      overlay.classList.add('opacity-0', 'pointer-events-none');
    }
  }

  teamPanelBtn?.addEventListener('click', openPanel);
  closePanelBtn?.addEventListener('click', closePanel);
  overlay?.addEventListener('click', closePanel);
}