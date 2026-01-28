/**
 * Login View Component
 * 
 * Provides user authentication through:
 * 1. Traditional email/password login
 * 2. Google OAuth integration
 * 3. 2FA support for enhanced security
 * 
 * @module LoginView
 */

import { api } from '@/api/client';
import { session } from '@/state/session';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Google OAuth button configuration */
const GOOGLE_BUTTON_CONFIG = {
  theme: 'filled_white' as const,
  size: 'large' as const,
  text: 'signin_with' as const,
  shape: 'rect' as const,
  logo_alignment: 'left' as const,
  locale: 'en' as const,
};

/** URL of the Google Identity Services SDK */
const GOOGLE_IDENTITY_SDK_URL = 'https://accounts.google.com/gsi/client';

// ============================================================================
// VIEW COMPONENT
// ============================================================================

/**
 * Renders the login page HTML
 * @returns HTML string for the login view
 */
export function LoginView() {
  return `
    <div class="login-wrapper">
      <div class="login-container">
        <a href="#/" style="text-decoration: none;">
          <h1 class="login-main-title">TRANSCENDENCE<br><span>PONG 3D</span></h1>
        </a>
        <div class="login-card">
          <h2>Please Login</h2>
          <form id="login-form" method="post" novalidate>
            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="Enter email" required />
            
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Enter password" required />
            
            <button type="submit" class="login-btn">Login</button>

            <!-- Official Google OAuth button renders here with google-btn styling -->
            <div id="google-oauth" class="google-btn"></div>
          </form>
          
          <p class="register-text">
            Don't have an account? <a href="#/register">Register</a>
          </p>
          
          <div id="login-error" style="display: none;" class="login-error"></div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Initializes all event handlers for the login view
 * - Traditional email/password form submission
 * - Google OAuth button rendering and initialization
 */
export function initLoginHandlers() {
  setupTraditionalLogin();
  setupGoogleOAuth();
}

/**
 * Sets up traditional email/password login form
 */
function setupTraditionalLogin() {
  const form = document.getElementById('login-form') as HTMLFormElement | null;
  const errorEl = document.getElementById('login-error');
  
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear any previous error messages
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }

    // Extract form data
    const data = new FormData(form);
    const email = String(data.get('email'));
    const password = String(data.get('password'));

    try {
      // Attempt login via API
      const res = await api.login({ email, password });

      // 2FA-enabled account: backend returns only user (no token)
      if ((res as any)?.user && !(res as any)?.token) {
        const user = (res as any).user;
        if (user.is2FAEnabled) {
          // Ensure we are in regular flow (clear any Google leftovers)
          sessionStorage.removeItem('tempToken');
          sessionStorage.removeItem('pendingUser');

          sessionStorage.setItem('pendingEmail', user.email || email);
          location.hash = '#/login-2fa';
          return;
        }
      }

      // Explicit flag path if backend uses twoFARequired
      if ((res as any)?.twoFARequired && (res as any)?.user) {
        const user = (res as any).user;
        // Ensure regular flow (clear Google leftovers)
        sessionStorage.removeItem('tempToken');
        sessionStorage.removeItem('pendingUser');

        sessionStorage.setItem('pendingEmail', user.email || email);
        location.hash = '#/login-2fa';
        return;
      }
      
      // Normal login: token present
      if ((res as any)?.token && (res as any)?.user) {
        session.setAuth((res as any).token, (res as any).user);
        location.hash = '#/dashboard';
        return;
      }

      // Fallback: unexpected response
      if (errorEl) {
        errorEl.textContent = 'Unexpected login response';
        errorEl.style.display = 'block';
      }
    } catch (err: any) {
      // Display error message
      if (errorEl) {
        errorEl.textContent = err.message || 'Login failed';
        errorEl.style.display = 'block';
      }
    }
  });
}

/**
 * Sets up Google OAuth sign-in button
 * - Loads Google Identity Services SDK dynamically
 * - Renders official Google sign-in button
 * - Handles OAuth callback and authentication
 */
function setupGoogleOAuth() {
  const googleBtnEl = document.getElementById('google-oauth') as HTMLDivElement | null;
  
  if (!googleBtnEl) return;

  // Validate Google Client ID from environment
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error('Missing VITE_GOOGLE_CLIENT_ID in .env file');
    return;
  }

  // Hide button until loaded
  googleBtnEl.style.visibility = 'hidden';

  // Load Google Identity Services SDK and initialize
  ensureGoogleScript()
    .then(() => {
      const w = window as any;
      const googleId = w.google?.accounts?.id;
      
      if (!googleId) {
        console.error('Google Identity Services not available');
        return;
      }

      // Initialize Google Identity Services (only once globally)
      if (!w.__gisInitialized) {
        googleId.initialize({
          client_id: clientId,
          callback: handleGoogleOAuthCallback,
        });
        w.__gisInitialized = true;
      }

      // Render Google button with full width
      googleBtnEl.innerHTML = '';
      googleId.renderButton(googleBtnEl, {
        ...GOOGLE_BUTTON_CONFIG,
        width: googleBtnEl.offsetWidth || 380,
      });

      // Show button after rendering
      googleBtnEl.style.visibility = 'visible';
    })
    .catch((error) => {
      console.error('Failed to load Google Identity Services:', error);
    });
}

/**
 * Handles the OAuth callback from Google
 * @param response - Google OAuth response containing the ID token
 */
async function handleGoogleOAuthCallback(response: any) {
  const idToken = response?.credential;
  
  if (!idToken) {
    console.error('No credential received from Google');
    return;
  }

  try {
    // Send ID token to backend for verification
    const res = await api.oauthGoogle(idToken);
    
    if (res?.token && res?.user) {
      // Check if user has 2FA enabled
      if (res.user.is2FAEnabled) {
        // Store token temporarily and redirect to 2FA verification
        sessionStorage.setItem('tempToken', res.token);
        sessionStorage.setItem('pendingEmail', res.user.email);
        sessionStorage.setItem('pendingUser', JSON.stringify(res.user));
        location.hash = '#/login-2fa';
        return;
      }
      
      // Store authentication token and user data
      session.setAuth(res.token, res.user);
      // Redirect to dashboard on success
      location.hash = '#/dashboard';
    }
  } catch (err: any) {
    alert(err?.message || 'Google login failed');
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Ensures Google Identity Services SDK is loaded
 * - Checks if SDK is already loaded
 * - Dynamically injects script tag if not present
 * - Returns a promise that resolves when SDK is ready
 * 
 * @returns Promise that resolves when Google SDK is loaded
 */
function ensureGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    
    // Check if Google Identity Services is already loaded
    if (w.google?.accounts?.id) {
      resolve();
      return;
    }

    // Check if script tag already exists
    let script = document.querySelector('script[data-gis]') as HTMLScriptElement | null;
    
    if (!script) {
      // Create and inject Google Identity Services script
      script = document.createElement('script');
      script.src = GOOGLE_IDENTITY_SDK_URL;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-gis', '1'); // Mark script for future reference
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK'));
      document.head.appendChild(script);
    } else {
      // Script exists but may not be loaded yet
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', () => reject(new Error('Google Identity Services SDK error')));
    }
  });
}

