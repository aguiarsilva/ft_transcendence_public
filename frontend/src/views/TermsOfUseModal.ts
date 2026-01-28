/**
 * Terms of Use Modal Component
 * @returns HTML string for the Terms of Use modal
 */
export function TermsOfUseModal(): string {
  return `
<div
  id="terms-modal"
  class="fixed inset-0 z-50 hidden bg-black/50 flex items-center justify-center p-4"
>
  <!-- Backdrop -->
  <div class="absolute inset-0"></div>

  <!-- Modal -->
  <div
    class="relative w-full max-w-3xl max-h-[85vh]
           bg-white rounded-xl shadow-2xl
           flex flex-col"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b bg-slate-50 rounded-t-xl">
      <h2 class="text-xl font-bold text-slate-800">Terms of Use</h2>
      <button
        class="modal-close text-2xl leading-none text-slate-500 hover:text-slate-800"
        data-modal="terms-modal"
      >
        &times;
      </button>
    </div>

    <!-- Body -->
      <div class="p-6 overflow-y-auto text-sm text-slate-600 leading-relaxed">
        <p>
          Welcome to <strong>Transcendence 42</strong> ("the Game").
          By accessing or using the Game, you agree to the following Terms of Service.
          Please read them carefully before playing.
        </p>

        <h3>1. Acceptance of Terms</h3>
        <p>
          By accessing or using the Game, you affirm that you:
          <ul>
            <li>Are at least <strong>16 years old</strong> (or the age of digital consent in your jurisdiction, whichever is higher).</li>
            <li>Have read, understood, and agreed to these Terms and our <a href="#" id="privacy-link">Privacy Policy</a>.</li>
            <li>Will comply with all applicable laws and regulations, including the <strong>General Data Protection Regulation (GDPR)</strong>.</li>
          </ul>
          If you are under 18, you represent that you have obtained consent from a parent or legal guardian to use the Game.
        </p>

        <h3>2. User Rights and GDPR Compliance</h3>
        <p>
          You have the following rights under GDPR:
          <ul>
            <li><strong>Right to Access:</strong> Request a copy of your personal data.</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data.</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your data.</li>
            <li><strong>Right to Restrict Processing:</strong> Limit how we process your data.</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format.</li>
          </ul>
          To exercise these rights, contact us at: <strong>transcendence_team@42Wolfsburg.de</strong>.
        </p>

        <h3>3. Use of the Game</h3>
        <ul>
          <li>You may use the Game for <strong>personal, non-commercial purposes only</strong>.</li>
          <li>You must not use the Game in any way that violates laws or infringes on others' rights.</li>
          <li>You agree not to interfere with the Game's operation, servers, or networks.</li>
        </ul>

        <h3>4. Accounts and Data</h3>
        <p>
          If the Game requires an account, you are responsible for maintaining the confidentiality of your login information.
          We collect and process <strong>only the data necessary</strong> for gameplay, such as:
          <ul>
            <li>Username</li>
            <li>Game statistics (scores, rankings)</li>
            <li>Technical data (IP address, browser type) for security and performance improvements.</li>
          </ul>
          We <strong>do not collect</strong> sensitive personal data.
        </p>

        <h3>5. Intellectual Property</h3>
        <p>
          All content, code, graphics, and design elements of the Game are owned by the <strong>Transcendence 42</strong> team or its licensors.
          You may not copy, modify, or distribute any part of the Game without authorization.
        </p>

        <h3>6. Data Protection and Security</h3>
        <p>
          We implement <strong>reasonable technical and organizational measures</strong> to protect your data.
          In the event of a data breach, we will notify affected users and relevant authorities within <strong>72 hours</strong>, as required by GDPR.
        </p>

        <h3>7. Disclaimer of Warranties</h3>
        <p>
          The Game is provided "<strong>as is</strong>" and "<strong>as available</strong>".
          We do not guarantee that the Game will be error-free or that access will be uninterrupted.
        </p>

        <h3>8. Limitation of Liability</h3>
        <p>
          To the fullest extent permitted by law, the <strong>Transcendence 42</strong> team is not liable for any damages arising from your use or inability to use the Game, including data loss or service interruptions.
        </p>

        <h3>9. Changes to Terms</h3>
        <p>
          We may update these Terms occasionally.
          Continued use of the Game after updates constitutes acceptance of the new Terms.
        </p>

        <h3>10. Contact</h3>
        <p>
          For questions about these Terms or your rights under GDPR, contact us at:
          <strong>transcendence_team@42Wolfsburg.de</strong>
        </p>
      </div>
    </div>
  </div>
</div>
  `;
}