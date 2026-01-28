/**
 * Main Application Entry Point
 * 
 * This file initializes the SPA (Single Page Application) router and registers
 * all application routes. Each route maps a URL pattern to a view component.
 */

import './styles.css';
import { Router } from './router';

// View imports
import { DashboardView, initDashboardHandlers } from './views/DashboardView';
import { LoginView, initLoginHandlers } from './views/LoginView';
import { RegisterView, initRegisterHandlers } from './views/RegisterView';
import { TwoFALoginVerifyView, initTwoFALoginHandlers } from './views/TwoFAVerifyView';
import { TwoFASetupView, initTwoFASetupHandlers } from './views/TwoFASetupView';
import { ChangePasswordView, initChangePasswordHandlers } from './views/ChangePasswordView';
import { FriendsView, initFriendsHandlers } from './views/FriendsView';
import { LandingView, initLandingHandlers } from './views/LandingView';
import { AboutView, initAboutHandlers } from './views/AboutView';
import { GameView, initGameHandlers, cleanupGame } from './views/GameView';
import { LeaderboardView, initLeaderboardHandlers } from './views/LeaderboardView';
import { UserProfileView, initUserProfileHandlers } from './views/UserProfileView';
import { TournamentView, initTournamentHandlers, cleanupTournamentView } from './views/TournamentView';
import { TermsOfUseModal } from './views/TermsOfUseModal';
import { PrivacyPolicyModal } from './views/PrivacyPolicyModal';


// Initialize router with the main app container
const app = document.getElementById('app')!;
const router = new Router(app);

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

/**
 * Landing Page Route ('/')
 * Public route - accessible to all users
 */
router.register({
  path: /^\/$/,
  title: 'Welcome',
  render: () => {
    const html = LandingView();
    setTimeout(initLandingHandlers, 0)
    //queueMicrotask(initLandingHandlers);
    return html;
  },
});

/**
 * Dashboard Route ('/dashboard')
 * Protected route - requires authentication
 */
router.register({
  path: /^\/dashboard$/,
  title: 'Dashboard',
  render: () => {
    const html = DashboardView();
    setTimeout(initDashboardHandlers, 0);
    //queueMicrotask(initDashboardHandlers);
    return html;
  },
});

/**
 * Login Route ('/login')
 * Handles user authentication with email/password and Google OAuth
 * Uses setTimeout instead of queueMicrotask to ensure DOM is ready for OAuth button
 */
router.register({
  path: /^\/login$/,
  title: 'Login',
  render: () => {
    const html = LoginView();
    setTimeout(initLoginHandlers, 0);
    return html;
  },
});

/**
 * Register Route ('/register')
 * Handles new user registration with email/password and Google OAuth
 */
router.register({
  path: /^\/register$/,
  title: 'Register',
  render: () => {
    const html = RegisterView();
    queueMicrotask(initRegisterHandlers);
    return html;
  },
});

/**
 * Two-Factor Authentication Verification Route ('/login-2fa')
 * Handles 2FA code verification during login
 */
router.register({
  path: /^\/login-2fa$/,
  title: '2FA Verify',
  render: () => {
    const html = TwoFALoginVerifyView();
    setTimeout(initTwoFALoginHandlers, 0);
    return html;
  },
});

/**
 * Settings/Two-Factor Authentication Setup Routes ('/settings', '/twofa')
 * Allows users to manage profile settings and 2FA
 */
router.register({
  path: /^\/settings$/,
  title: 'Settings',
  render: () => {
    const html = TwoFASetupView();
    queueMicrotask(initTwoFASetupHandlers);
    return html;
  },
});

router.register({
  path: /^\/twofa$/,
  title: '2FA',
  render: () => {
    const html = TwoFASetupView();
    queueMicrotask(initTwoFASetupHandlers);
    return html;
  },
});

/**
 * Change Password Route ('/change-password')
 * Protected route - allows authenticated users to change their password
 */
router.register({
  path: /^\/change-password$/,
  title: 'Change Password',
  render: () => {
    const html = ChangePasswordView();
    queueMicrotask(initChangePasswordHandlers);
    return html;
  },
});

/**
 * Friends Route ('/friends')
 * Protected route - manage friend connections
 */
router.register({
  path: /^\/friends$/,
  title: 'Friends',
  render: () => {
    const html = FriendsView();
    setTimeout(initFriendsHandlers, 0);
    //initFriendsHandlers();
    return html;
  },
});

/**
 * Leaderboard Route ('/leaderboard')
 * View global rankings
 */
router.register({
  path: /^\/leaderboard$/,
  title: 'Leaderboard',
  render: () => {
    const html = LeaderboardView();
    queueMicrotask(initLeaderboardHandlers);
    return html;
  },
});

/**
 * User Profile Route ('/user/:username')
 * View another user's profile
 */
router.register({
  path: /^\/user\/(?<id>\d+)$/,
  title: 'User Profile',
  render: (params) => {
    const html = UserProfileView(params);
    queueMicrotask(() => initUserProfileHandlers(params));
    return html;
  },
});

/**
 * About Route ('/about')
 * Information about the Transcendence Pong 3D project
 * Includes team panel feature
 */
router.register({
  path: /^\/about$/,
  title: 'About',
  render: () => {
    const html = AboutView();
    setTimeout(initAboutHandlers, 0);
    return html;
  },
});

/**
 * Game Route ('/game')
 * Main 3D Pong game view
 * Includes cleanup function to properly dispose of game resources
 */
router.register({
  path: /^\/game$/,
  title: 'Pong Game',
  render: () => {
    const html = GameView();
    setTimeout(initGameHandlers, 0);
    //queueMicrotask(initGameHandlers);
    return html;
  },
  cleanup: cleanupGame,
});


router.register({
  path: /^\/tournaments$/,
  title: "Tournaments",
  render: () => {
    const html = TournamentView();
    setTimeout(initTournamentHandlers, 0);
    return html;
  },
  cleanup: cleanupTournamentView,
});


// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

/**
 * Start the router and navigate to the current URL
 * This triggers the initial page load based on the current hash
 */

document.body.insertAdjacentHTML('beforeend', TermsOfUseModal());
document.body.insertAdjacentHTML('beforeend', PrivacyPolicyModal());

router.navigate();
