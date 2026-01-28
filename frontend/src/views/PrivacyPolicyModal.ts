/**
 * Privacy Policy Component
 * @returns HTML string for the Privacy Policy modal
 */
export function PrivacyPolicyModal(): string {
  return `
<div id="privacy-modal" class="fixed inset-0 z-50 hidden bg-black/50 flex items-center justify-center p-4"
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
      <h2 class="text-xl font-bold text-slate-800">Privacy Policy</h2>
      <button
        class="modal-close text-2xl leading-none text-slate-500 hover:text-slate-800"
        data-modal="privacy-modal"
      >
        &times;
      </button>
    </div>

    <!-- Body -->
      <div class="p-6 overflow-y-auto text-sm text-slate-600 leading-relaxed">
        <p>
          This Privacy Policy explains how <strong>Transcendence 42</strong> ("we," "our," or "us") collects, uses, and protects your information when you use <strong>the Game</strong>.
          We are committed to complying with the <strong>General Data Protection Regulation (GDPR)</strong> and respecting your privacy.
        </p>

        <h3>1. Information We Collect</h3>
        <p>
          We collect <strong>only the minimum information necessary</strong> to provide and improve the Game:
          <ul>
            <li><strong>Account Data:</strong> Username, email (if provided).</li>
            <li><strong>Gameplay Data:</strong> Scores, rankings, match history.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information (for security and performance).</li>
          </ul>
          We <strong>do not collect</strong> sensitive personal data (e.g., racial or ethnic origin, political opinions, religious beliefs, health data, or biometric data).
        </p>

        <h3>2. Legal Basis for Processing</h3>
        <p>
          We process your data based on:
          <ul>
            <li><strong>Your consent</strong> (e.g., when you create an account).</li>
            <li><strong>Contractual necessity</strong> (e.g., to provide the Game).</li>
            <li><strong>Legitimate interest</strong> (e.g., improving security or performance).</li>
          </ul>
        </p>

        <h3>3. How We Use Your Data</h3>
        <p>
          We use your data <strong>only for the following purposes</strong>:
          <ul>
            <li>Providing and improving the Game.</li>
            <li>Displaying leaderboards and statistics.</li>
            <li>Ensuring security and preventing fraud.</li>
            <li>Complying with legal obligations (e.g., GDPR).</li>
          </ul>
        </p>

        <h3>4. Data Retention</h3>
        <p>
          We retain your data <strong>only as long as necessary</strong> to fulfill the purposes outlined in this Policy, or as required by law.
          You may request deletion of your data at any time by contacting us at: <strong>transcendence_team@42Wolfsburg.de</strong>.
        </p>

        <h3>5. Data Sharing</h3>
        <p>
          We <strong>do not sell or rent</strong> your data to third parties.
          We may share data <strong>only</strong> in the following cases:
          <ul>
            <li>With service providers (e.g., hosting providers) under strict confidentiality agreements.</li>
            <li>To comply with legal obligations (e.g., court orders).</li>
          </ul>
        </p>

        <h3>6. Cookies and Tracking</h3>
        <p>
          We use <strong>session cookies</strong> to remember your login status.
          We <strong>do not use tracking cookies</strong> for advertising or analytics.
        </p>

        <h3>7. User Rights Under GDPR</h3>
        <p>
          You have the following rights under GDPR:
          <ul>
            <li><strong>Right to Access:</strong> Request a copy of your data.</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate data.</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your data.</li>
            <li><strong>Right to Restrict Processing:</strong> Limit how we process your data.</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format.</li>
            <li><strong>Right to Object:</strong> Object to processing for direct marketing or legitimate interest.</li>
          </ul>
          To exercise these rights, contact us at: <strong>transcendence_team@42Wolfsburg.de</strong>.
        </p>

        <h3>8. Data Security</h3>
        <p>
          We implement <strong>technical and organizational measures</strong> to protect your data, including:
          <ul>
            <li>Encryption of sensitive data.</li>
            <li>Regular security audits.</li>
            <li>Access controls for team members.</li>
          </ul>
        </p>

        <h3>9. Children’s Privacy</h3>
        <p>
          The Game is <strong>not intended for children under 16</strong>.
          We do not knowingly collect data from children.
          If you believe we have collected data from a child, contact us immediately.
        </p>

        <h3>10. Changes to This Policy</h3>
        <p>
          We may update this Policy occasionally.
          We will notify you of significant changes via the Game or email.
        </p>

        <h3>11. Contact Us</h3>
        <p>
          For questions about this Policy or your rights under GDPR, contact us at:
          <strong>transcendence_team@42Wolfsburg.de</strong>
        </p>
      </div>
    </div>
  </div>
</div>
  `;
}