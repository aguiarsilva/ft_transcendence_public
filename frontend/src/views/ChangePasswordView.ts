import { api } from '@/api/client';
import { session } from '@/state/session';

export function ChangePasswordView() {
  if (!session.isAuthenticated()) location.hash = '#/login';
  return `
    <div class="container py-10">
      <div class="mx-auto max-w-md bg-white rounded-lg shadow p-6">
        <h1 class="text-2xl font-semibold mb-6">Change Password</h1>
        <form id="change-password-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium">Current Password</label>
            <input type="password" name="currentPassword" class="mt-1 w-full border rounded px-3 py-2 italic text-slate-700" required />
          </div>
          <div>
            <label class="block text-sm font-medium">New Password</label>
            <input type="password" name="newPassword" class="mt-1 w-full border rounded px-3 py-2 italic text-slate-700" required />
          </div>
          <button class="w-full btn-primary">Update</button>
        </form>
        <div id="change-password-msg" class="text-sm text-slate-700 mt-4"></div>
      </div>
    </div>
  `;
}

export function initChangePasswordHandlers() {
  const form = document.getElementById('change-password-form') as HTMLFormElement | null;
  const msg = document.getElementById('change-password-msg');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form!);
    try {
      await api.changePassword({
        currentPassword: String(data.get('currentPassword')),
        newPassword: String(data.get('newPassword')),
      });
      msg!.textContent = 'Password updated successfully';
      msg!.classList.add('text-slate-600');
    } catch (e: any) {
      msg!.textContent = e.message || 'Failed to update password';
      msg!.classList.add('text-slate-900');
    }
  });
}
