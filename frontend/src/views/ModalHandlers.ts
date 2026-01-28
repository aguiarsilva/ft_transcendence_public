/**
 * Modal Handler Utilities
 * Provides functionality to open, close, and manage modal dialogs (Terms of Use and Privacy Policy)
 */

/**
 * Sets up modal popup handlers for any modal
 * @param options - Configuration for modal handlers
 */
export function setupModalHandlers(options: {
  triggerIds: string[];
  modalIds: string[];
}) {
  const { triggerIds, modalIds } = options;

  // Setup trigger buttons
  triggerIds.forEach((triggerId, index) => {
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalIds[index]);

    trigger?.addEventListener('click', (e) => {
      e.preventDefault();
      if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
      }
    });
  });

  // Setup close buttons
  document.querySelectorAll('.modal-close').forEach((closeBtn) => {
    closeBtn.addEventListener('click', () => {
      const modalId = closeBtn.getAttribute('data-modal');
      const modal = document.getElementById(modalId || '');
      if (modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // Close modals when clicking outside
  modalIds.forEach((modalId) => {
    const modal = document.getElementById(modalId);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // Close modals with Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modalIds.forEach((modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
          modal.classList.add('hidden');
        }
      });
    }
  });
}