import { api, resolveAvatarUrl } from '@/api/client';
import { session } from '@/state/session';

export function TwoFASetupView() {
  if (!session.isAuthenticated()) {
    location.hash = '#/login';
  }

  const user = session.user();
  const firstName = user?.firstName || 'John';
  const lastName = user?.lastName || 'Smith';
  const username = user?.username || user?.email?.split('@')[0] || 'jsmith';
  const email = user?.email || 'jsmith@example.com';
  const avatarUrl = resolveAvatarUrl(user?.avatar || '/avatars/avatar.jpg');

  const is2FAEnabled = !!user?.is2FAEnabled;

  return `
    <div class="page-background">
      <div class="main-wrapper" id="main-wrapper">
        
        <!-- Header -->
        <header class="header">
          <div class="logo">⚙ Profile Settings</div>

          <div class="top-buttons">
            <a href="#/dashboard" class="header-btn">🏠 Dashboard</a>
            <button class="header-btn logout" id="logout-btn">⎋ Logout</button>
          </div>
        </header>

        <div class="settings-grid">

          <!-- BASIC INFORMATION -->
          <div class="card">
            <h2>Basic Information</h2>

            <!-- First Name -->
            <div class="info-row">
              <div class="info-label">First Name</div>
              <div class="info-value" id="firstName-display">${firstName}</div>
              <button class="edit-icon" data-field="firstName">✎</button>

              <div class="edit-bar">
                <input type="text" id="edit-firstName" placeholder="New first name" value="${firstName}">
                <button class="small-update-btn" data-field="firstName">Update</button>
                <button class="close-edit">✖</button>
              </div>
            </div>

            <!-- Last Name -->
            <div class="info-row">
              <div class="info-label">Last Name</div>
              <div class="info-value" id="lastName-display">${lastName}</div>
              <button class="edit-icon" data-field="lastName">✎</button>

              <div class="edit-bar">
                <input type="text" id="edit-lastName" placeholder="New last name" value="${lastName}">
                <button class="small-update-btn" data-field="lastName">Update</button>
                <button class="close-edit">✖</button>
              </div>
            </div>

            <!-- Username -->
            <div class="info-row">
              <div class="info-label">Username</div>
              <div class="info-value" id="username-display">${username}</div>
              <button class="edit-icon" data-field="username">✎</button>

              <div class="edit-bar">
                <input type="text" id="edit-username" placeholder="New username" value="${username}">
                <button class="small-update-btn" data-field="username">Update</button>
                <button class="close-edit">✖</button>
              </div>
            </div>

            <!-- Email -->
            <div class="info-row">
              <div class="info-label">Email</div>
              <div class="info-value" id="email-display">${email}</div>
              <button class="edit-icon" data-field="email">✎</button>

              <div class="edit-bar">
                <input type="email" id="edit-email" placeholder="New email" value="${email}">
                <button class="small-update-btn" data-field="email">Update</button>
                <button class="close-edit">✖</button>
              </div>
            </div>

            <!-- Password -->
            <div class="info-row">
              <div class="info-label">Password</div>
              <div class="info-value">••••••••</div>
              <button class="edit-icon" id="edit-password-btn">✎</button>

              <div class="edit-bar password-bar" id="password-edit-dropdown">
                <input type="password" id="current-password" placeholder="Current password">
                <input type="password" id="new-password" placeholder="New password">
                <button class="small-update-btn" id="update-password-btn">Change Password</button>
                <button class="close-edit" id="close-password-dropdown">✖</button>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="settings-right-column">
            <!-- AVATAR -->
            <div class="card avatar-card">
              <h2>Avatar</h2>
              <img src="${avatarUrl}" class="avatar-preview" id="avatar-preview" alt="Avatar Preview">
              <label class="upload-btn">
                Change Avatar
                <input type="file" id="avatar-upload" accept="image/*">
              </label>
            </div>

            <!-- TWO-FACTOR AUTHENTICATION -->
            <div class="card twofa-card">
              <h2>Two-Factor Authentication (2FA)</h2>

              <!-- Only one button shown at load -->
              <button 
                type="button" 
                class="twofa-enable-btn" 
                id="btn-enable-2fa"
                style="${is2FAEnabled ? 'display:none;' : 'display:block;'}"
              >
                Enable 2FA
              </button>

              <button
                type="button"
                class="twofa-disable-btn"
                id="btn-disable"
                style="${is2FAEnabled ? 'display:block;' : 'display:none;'}"
              >
                Disable 2FA
              </button>

              <!-- Inline disable flow input (appears only when user clicks Disable 2FA) -->
              <div id="disable-inline" class="disable-inline" style="display:none;">
                <div class="verification-input-group">
                  <input
                    type="text"
                    id="disable-token"
                    maxlength="6"
                    placeholder="123456"
                    class="verification-input"
                  />
                  <button
                    type="button"
                    id="btn-disable-confirm"
                    class="verify-btn"
                  >
                    Confirm Disable
                  </button>
                  <button
                    type="button"
                    id="btn-disable-cancel"
                    class="secondary-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal overlay for Enable 2FA flow -->
      <div id="twofa-modal-overlay" class="modal-overlay" style="display:none;">
        <div class="modal-content">
          <h3>Set up Two-Factor Authentication</h3>
          <div id="modal-qr-container" class="qr-container" style="justify-content:center;"></div>
          <div class="qr-instructions">
            <p>
              To enable 2FA, follow these steps:
            </p>
            <p>
              1. Open your authenticator app (e.g., Google Authenticator, Authy, or Microsoft Authenticator).<br>
              2. Scan the QR code above with your app.<br>
              3. Enter the 6-digit code from the app into the field below to complete setup.
            </p>
          </div>
          <div class="verification-input-group" style="margin-top:16px;">
            <input
              type="text"
              id="modal-token"
              maxlength="6"
              placeholder="123456"
              class="verification-input"
            />
            <button
              type="button"
              id="modal-btn-verify"
              class="verify-btn"
            >
              Verify 2FA
            </button>
            <button
              type="button"
              id="modal-btn-cancel"
              class="secondary-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initTwoFASetupHandlers() {
  console.log('initTwoFASetupHandlers called');
  let setupInitiated = false;

  setTimeout(() => {
    console.log('DOM ready, attaching handlers');
    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      session.clear();
      window.location.hash = '#/login';
    });

    const mainWrapper = document.getElementById('main-wrapper');

    // Load fresh profile data and update UI
    const token = session.token();
    if (token) {
      api
        .me()
        .then((res) => {
          const current = res.user;
          session.setAuth(token, current);

          const firstNameEl = document.getElementById('firstName-display');
          if (firstNameEl) firstNameEl.textContent = current.firstName;
          const lastNameEl = document.getElementById('lastName-display');
          if (lastNameEl) lastNameEl.textContent = current.lastName;
          const usernameEl = document.getElementById('username-display');
          if (usernameEl) usernameEl.textContent = current.username;
          const emailEl = document.getElementById('email-display');
          if (emailEl) emailEl.textContent = current.email;
          const avatarImg = document.getElementById('avatar-preview') as HTMLImageElement | null;
          if (avatarImg && current.avatar) avatarImg.src = current.avatar;

          const enableBtn = document.getElementById('btn-enable-2fa') as HTMLElement | null;
          const disableBtn = document.getElementById('btn-disable') as HTMLElement | null;

          if (current.is2FAEnabled) {
            setupInitiated = false;
            if (enableBtn) enableBtn.style.display = 'none';
            if (disableBtn) disableBtn.style.display = 'block';
          } else {
            if (enableBtn) enableBtn.style.display = 'block';
            if (disableBtn) disableBtn.style.display = 'none';
          }
        })
        .catch(() => { });
    }

    // Edit buttons - show dropdown modal
    document.querySelectorAll('.info-row .edit-icon').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = (btn as HTMLElement).closest('.info-row');
        if (!row) return;

        const editBar = row.querySelector('.edit-bar') as HTMLElement | null;
        if (!editBar) return;

        editBar.style.display = 'block';
        setTimeout(() => {
          editBar.classList.add('show');
        }, 10);

        (btn as HTMLElement).style.display = 'none';
      });
    });

    // Close buttons
    document.querySelectorAll('.info-row .close-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const editBar = (btn as HTMLElement).closest('.edit-bar') as HTMLElement | null;
        if (!editBar) return;

        editBar.classList.remove('show');

        setTimeout(() => {
          editBar.style.display = 'none';
          const row = editBar.closest('.info-row');
          const icon = row?.querySelector('.edit-icon') as HTMLElement | null;
          if (icon) {
            icon.style.display = 'inline-block';
          }
        }, 250);
      });
    });

    // Update buttons - API calls
    document.querySelectorAll('.small-update-btn[data-field]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const field = (btn as HTMLElement).getAttribute('data-field');
        if (!field) return;

        const input = document.getElementById(`edit-${field}`) as HTMLInputElement | null;
        if (!input || !input.value) {
          alert('Please enter a value');
          return;
        }

        try {
          const result = await api.updateProfile({ [field]: input.value } as any);
          const updatedUser = result.user;
          const currentToken = session.token();
          if (currentToken) {
            session.setAuth(currentToken, updatedUser);
          }

          const displayEl = document.getElementById(`${field}-display`);
          if (displayEl) {
            displayEl.textContent = String((updatedUser as any)[field] ?? input.value);
          }
          alert('Updated successfully!');

          const editBar = (btn as HTMLElement).closest('.edit-bar') as HTMLElement | null;
          if (editBar) {
            editBar.classList.remove('show');
            setTimeout(() => {
              editBar.style.display = 'none';
              const row = editBar.closest('.info-row');
              const icon = row?.querySelector('.edit-icon') as HTMLElement | null;
              if (icon) {
                icon.style.display = 'inline-block';
              }
            }, 250);
          }
        } catch (e: any) {
          alert(e.message || 'Update failed');
        }
      });
    });

    // Password update
    document.getElementById('update-password-btn')?.addEventListener('click', async () => {
      const current = (document.getElementById('current-password') as HTMLInputElement | null)?.value;
      const newPwd = (document.getElementById('new-password') as HTMLInputElement | null)?.value;

      if (!current || !newPwd) {
        alert('Fill both fields');
        return;
      }

      try {
        await api.changePassword({ currentPassword: current, newPassword: newPwd });
        alert('Password changed!');
        document.getElementById('close-password-dropdown')?.dispatchEvent(new Event('click'));
      } catch (e: any) {
        alert(e.message || 'Failed');
      }
    });

    // Avatar upload
    document.getElementById('avatar-upload')?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const result = await api.uploadAvatar(file);
        const updatedUser = result.user;
        const img = document.getElementById('avatar-preview') as HTMLImageElement | null;
        if (img && updatedUser.avatar) {
          img.src = resolveAvatarUrl(updatedUser.avatar) + `?t=${Date.now()}`;
        }
        const currentToken = session.token();
        if (currentToken) {
          session.setAuth(currentToken, updatedUser);
        }
        alert('Avatar updated!');
      } catch (err: any) {
        alert(err.message || 'Avatar upload failed');
      }
    });

    // Modal elements
    const modalOverlay = document.getElementById('twofa-modal-overlay') as HTMLElement | null;
    const modalQR = document.getElementById('modal-qr-container') as HTMLElement | null;
    const modalTokenInput = document.getElementById('modal-token') as HTMLInputElement | null;
    const modalVerifyBtn = document.getElementById('modal-btn-verify') as HTMLButtonElement | null;
    const modalCancelBtn = document.getElementById('modal-btn-cancel') as HTMLButtonElement | null;

    // Helpers for modal + blur
    const openModal = () => {
      if (modalOverlay) modalOverlay.style.display = 'flex';
      if (mainWrapper) mainWrapper.classList.add('blurred');
      if (modalTokenInput) {
        modalTokenInput.value = '';
        modalTokenInput.focus();
      }
    };
    const closeModal = () => {
      if (modalOverlay) modalOverlay.style.display = 'none';
      if (mainWrapper) mainWrapper.classList.remove('blurred');
      if (modalQR) modalQR.innerHTML = '';
    };

    modalCancelBtn?.addEventListener('click', () => {
      closeModal();
      setupInitiated = false;
      const enableBtn = document.getElementById('btn-enable-2fa') as HTMLElement | null;
      if (enableBtn) enableBtn.style.display = 'block';
    });

    // 2FA Enable
    const enableBtn = document.getElementById('btn-enable-2fa');
    enableBtn?.addEventListener('click', async () => {
      try {
        const res = await api.twofaSetup();
        setupInitiated = true;
        openModal();

        // Generate QR code on frontend from otpauthUrl
        const QRCode = (await import('qrcode')).default;
        const qrDataURL = await QRCode.toDataURL(res.otpauthUrl);
        if (modalQR) {
          modalQR.innerHTML = `<img src="${qrDataURL}" style="max-width:220px" />`;
        }

        // Hide enable btn while modal is open
        const enableBtnEl = document.getElementById('btn-enable-2fa') as HTMLElement | null;
        if (enableBtnEl) enableBtnEl.style.display = 'none';
      } catch (e: any) {
        alert(e.message || 'Failed to start 2FA setup');
      }
    });

    // 2FA Verify
    modalVerifyBtn?.addEventListener('click', async () => {
      if (!setupInitiated) {
        alert('Please click "Enable 2FA" first.');
        return;
      }
      const verificationCode = modalTokenInput?.value?.trim();
      if (!verificationCode) {
        alert('Enter code');
        return;
      }
      if (!/^\d{6}$/.test(verificationCode)) {
        alert('Please enter a valid 6-digit code');
        return;
      }

      try {
        if (modalVerifyBtn) modalVerifyBtn.disabled = true;
        await api.twofaVerify(verificationCode);
        alert('2FA enabled!');
        closeModal();

        const disableBtn = document.getElementById('btn-disable') as HTMLElement | null;
        if (disableBtn) disableBtn.style.display = 'block';

        const enableBtnEl = document.getElementById('btn-enable-2fa') as HTMLElement | null;
        if (enableBtnEl) enableBtnEl.style.display = 'none';

        // Update session - 2FA enabled
        const tok = session.token();
        if (tok) {
          const updatedUser = { ...session.user()!, is2FAEnabled: true };
          session.setAuth(tok, updatedUser);
        }
      } catch (e: any) {
        alert(e.message || 'Failed');
      } finally {
        if (modalVerifyBtn) modalVerifyBtn.disabled = false;
      }
    });

    // 2FA Disable
    const disableBtn = document.getElementById('btn-disable') as HTMLButtonElement | null;
    const disableInline = document.getElementById('disable-inline') as HTMLElement | null;
    const disableTokenInput = document.getElementById('disable-token') as HTMLInputElement | null;
    const disableConfirmBtn = document.getElementById('btn-disable-confirm') as HTMLButtonElement | null;
    const disableCancelBtn = document.getElementById('btn-disable-cancel') as HTMLButtonElement | null;

    disableBtn?.addEventListener('click', () => {
      if (!disableInline || !disableBtn || !disableTokenInput) return;
      disableBtn.style.display = 'none';
      disableInline.style.display = 'block';
      disableTokenInput.value = '';
      disableTokenInput.focus();
    });

    disableCancelBtn?.addEventListener('click', () => {
      if (!disableInline || !disableBtn) return;
      disableInline.style.display = 'none';
      disableBtn.style.display = 'block';
    });

    disableConfirmBtn?.addEventListener('click', async () => {
      const code = disableTokenInput?.value?.trim();
      if (!code || !/^\d{6}$/.test(code)) {
        alert('Please enter a valid 6-digit code');
        return;
      }
      try {
        await api.twofaDisable(code);

        const tok = session.token();
        const u = session.user();
        if (tok && u) {
          session.setAuth(tok, { ...u, is2FAEnabled: false });
        }

        // Reset UI to initial "Enable 2FA" view
        const enableBtnEl = document.getElementById('btn-enable-2fa') as HTMLElement | null;
        const disableBtnEl = document.getElementById('btn-disable') as HTMLElement | null;
        if (enableBtnEl) enableBtnEl.style.display = 'block';
        if (disableInline) disableInline.style.display = 'none';
        if (disableBtnEl) disableBtnEl.style.display = 'none';
        setupInitiated = false;

        alert('2FA disabled successfully');
      } catch (e: any) {
        console.error('2FA disable error:', e);
        alert(e.message || 'Failed to disable 2FA. Invalid verification code.');
      }
    });
  }, 0);
}
