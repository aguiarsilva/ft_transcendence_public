import { api } from '@/api/client';
import { session } from '@/state/session';

export function TwoFALoginVerifyView() {
  // Check if this is Google OAuth flow or regular login
  const isGoogleFlow = sessionStorage.getItem('tempToken') !== null;
  const email = sessionStorage.getItem('pendingEmail') || '';
  
  return `
    <div class="login-wrapper">
      <div class="login-container">
        <a href="#/" style="text-decoration: none;">
          <h1 class="login-main-title">TRANSCENDENCE<br><span>PONG 3D</span></h1>
        </a>
        <div class="login-card">
          <h2>Enter 2FA Code</h2>
          
          <form id="twofa-login-form" novalidate>
            <input type="hidden" id="login-type" value="${isGoogleFlow ? 'google' : 'regular'}" />
            
            <label for="code">6 digit code</label>
            <input 
              type="text" 
              id="code" 
              name="token" 
              maxlength="6" 
              placeholder="Enter code"
              pattern="\\d{6}"
              required
              autocomplete="one-time-code"
            />
            
            <button type="button" class="login-btn" id="twofa-submit">Submit</button>
          </form>
          
          <p class="logout-text">
            Not you? <a href="#/login">Back to Login</a>
          </p>
          
          <div id="twofa-login-error" style="display: none;" class="login-error"></div>
        </div>
      </div>
    </div>
  `;
}

export function initTwoFALoginHandlers() {
  const form = document.getElementById('twofa-login-form') as HTMLFormElement | null;
  const errorEl = document.getElementById('twofa-login-error') as HTMLElement | null;
  const submitBtn = document.getElementById('twofa-submit') as HTMLButtonElement | null;
  const loginTypeInput = document.getElementById('login-type') as HTMLInputElement | null;

  if (!form || !errorEl || !submitBtn || !loginTypeInput) return;

  // Prevent accidental navigation by form submission
  form.setAttribute('action', 'javascript:void(0)');

  // Auto-focus and enforce 6-digit numeric input
  const codeInput = document.getElementById('code') as HTMLInputElement | null;
  if (codeInput) {
    codeInput.focus();
    codeInput.addEventListener('input', () => {
      const value = (codeInput.value || '').replace(/\D/g, '').slice(0, 6);
      codeInput.value = value;
    });
  }

  // If login type is regular, ensure Google leftovers are cleared
  if (loginTypeInput.value !== 'google') {
    sessionStorage.removeItem('tempToken');
    sessionStorage.removeItem('pendingUser');
  }

  const verify = async () => {
    errorEl.textContent = '';
    errorEl.style.display = 'none';

    const email = sessionStorage.getItem('pendingEmail') || '';
    const token = (codeInput?.value || '').trim();
    const loginType = loginTypeInput.value;

    if (!email || token.length !== 6 || !/^\d{6}$/.test(token)) {
      errorEl.textContent = 'Please enter a valid 6-digit code';
      errorEl.style.display = 'block';
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';

      const res = await api.login2fa({ email, token });

      if (loginType === 'google') {
        const googleToken = sessionStorage.getItem('tempToken');
        const googleUser = JSON.parse(sessionStorage.getItem('pendingUser') || '{}');
        session.setAuth(googleToken || res.token, { ...(googleUser?.id ? googleUser : res.user), is2FAEnabled: true });
        sessionStorage.removeItem('tempToken');
        sessionStorage.removeItem('pendingUser');
        sessionStorage.removeItem('pendingEmail');
      } else {
        session.setAuth(res.token, { ...res.user, is2FAEnabled: true });
        sessionStorage.removeItem('pendingEmail');
      }

      location.hash = '#/dashboard';
    } catch (err: any) {
      errorEl.textContent = err.message || '2FA verification failed';
      errorEl.style.display = 'block';
      // On failure, clear Google leftovers to avoid cross-user mixups next time
      sessionStorage.removeItem('tempToken');
      sessionStorage.removeItem('pendingUser');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    verify();
  });

  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    verify();
  });
}
