/**
 * Register View Component
 * 
 * Provides user registration through:
 * 1. Traditional email/password registration with user details
 * 2. Google OAuth integration for quick sign-up
 * 
 * @module RegisterView
 */

import { api } from '@/api/client';
import { session } from '@/state/session';
import { TermsOfUseModal } from '@/views/TermsOfUseModal';
import { PrivacyPolicyModal } from '@/views/PrivacyPolicyModal';
import { setupModalHandlers } from '@/views/ModalHandlers';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Google OAuth button configuration for registration */
const GOOGLE_BUTTON_CONFIG = {
  theme: 'filled_white' as const,
  size: 'large' as const,
  text: 'signup_with' as const, // Different text for registration
  shape: 'rect' as const,
  logo_alignment: 'left' as const,
  width: '100%' as any, // Full width to match register button (will be overridden by container)
  locale: 'en' as const,
};

/** URL of the Google Identity Services SDK */
const GOOGLE_IDENTITY_SDK_URL = 'https://accounts.google.com/gsi/client';

/** Delay before redirecting to login after successful registration (ms) */
const REDIRECT_DELAY = 1500;

// ============================================================================
// VIEW COMPONENT
// ============================================================================

/**
 * Renders the registration page HTML
 * @returns HTML string for the register view
 */
export function RegisterView() {
  return `
    <div class="register-wrapper">
      <div class="register-container">
        <a href="#/" style="text-decoration: none;">
          <h1 class="register-main-title">TRANSCENDENCE<br><span>PONG 3D</span></h1>
        </a>
        <div class="register-card">
          <h2>Create Account</h2>
          <form id="register-form">
            <div class="name-fields">
              <div class="field-group">
                <label for="firstName">First Name</label>
                <input type="text" id="firstName" name="firstName" placeholder="Enter first name" required />
              </div>
              <div class="field-group">
                <label for="lastName">Last Name</label>
                <input type="text" id="lastName" name="lastName" placeholder="Enter last name" required />
              </div>
            </div>
            
            <label for="username">Username</label>
            <input type="text" id="username" name="username" placeholder="Choose a username" required />
            
            <label for="email">E-mail</label>
            <input type="email" id="email" name="email" placeholder="Enter your email" required />
            
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Create a password" required />
            
            <!-- Terms of Use text with clickable links -->
            <p class="text-sm text-gray-400 text-center my-4">
              By registering I agree with the 
              <a href="#" id="terms-link" class="text-cyan-400 hover:text-cyan-300 hover:underline font-medium cursor-pointer">Terms of Use</a> 
              and 
              <a href="#" id="privacy-link" class="text-cyan-400 hover:text-cyan-300 hover:underline font-medium cursor-pointer">Privacy Policy</a>.
            </p>

            <button type="submit" class="register-btn">Register</button>

            <!-- Official Google OAuth button renders here with google-btn styling -->
            <div id="google-oauth" class="google-btn"></div>
          </form>
          
          <p class="login-text">
            Already have an account? <a href="#/login">Login</a>
          </p>
          
          <div id="register-error" style="display: none;" class="register-error"></div>
          <div id="register-success" style="display: none;" class="register-success"></div>
        </div>
      </div>
    </div>

  `;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Initializes all event handlers for the register view
 * - Traditional registration form submission
 * - Google OAuth button rendering and initialization
 */
export function initRegisterHandlers() {
  queueMicrotask(() => {
    if (!document.getElementById('terms-modal')) {
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = `
        ${TermsOfUseModal()}
        ${PrivacyPolicyModal()}
      `;
      document.body.appendChild(modalContainer);
    }

    setupTraditionalRegistration();
    setupGoogleOAuth();
    setupModalHandlers({
      triggerIds: ['terms-link', 'privacy-link'],
      modalIds: ['terms-modal', 'privacy-modal']
    });
  });
}

/**
 * Sets up traditional registration form with email/password
 */
function setupTraditionalRegistration() {
  const form = document.getElementById('register-form') as HTMLFormElement | null;
  const errorEl = document.getElementById('register-error');
  const successEl = document.getElementById('register-success');
  
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear any previous messages
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
    if (successEl) {
      successEl.textContent = '';
      successEl.style.display = 'none';
    }
    
    // Extract form data
    const data = new FormData(form);
    
    try {
      // Attempt registration via API
      await api.register({
        email: String(data.get('email')),
        username: String(data.get('username')),
        password: String(data.get('password')),
        firstName: String(data.get('firstName')),
        lastName: String(data.get('lastName')),
      });
      
      // Show success message
      if (successEl) {
        successEl.textContent = '✓ Account created successfully! Redirecting to login...';
        successEl.style.display = 'block';
      }
      
      // Redirect to login page after delay
      setTimeout(() => {
        location.hash = '#/login';
      }, REDIRECT_DELAY);
    } catch (err: any) {
      console.error('Registration failed:', err);
      
      // Display error message
      if (errorEl) {
        errorEl.textContent = err?.message || 'Registration failed';
        errorEl.style.display = 'block';
      }
    }
  });
    
}

/**
 * Sets up Google OAuth sign-up button
 * - Loads Google Identity Services SDK dynamically
 * - Renders official Google sign-up button
 * - Handles OAuth callback and registration/authentication
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
 * Handles the OAuth callback from Google for registration
 * @param response - Google OAuth response containing the ID token
 */
async function handleGoogleOAuthCallback(response: any) {
  const idToken = response?.credential;
  
  if (!idToken) {
    console.error('No credential received from Google');
    return;
  }

  try {
    // Send ID token to backend for verification and registration
    const res = await api.oauthGoogle(idToken);
    
    if (res?.token && res?.user) {
      // Store authentication token and user data
      session.setAuth(res.token, res.user);
      // Redirect to dashboard on success
      location.hash = '#/dashboard';
    }
  } catch (err: any) {
    alert(err?.message || 'Google sign up failed');
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