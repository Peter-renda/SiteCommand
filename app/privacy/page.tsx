import type { Metadata } from "next";
import LegalPage from "@/app/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — CPMA",
  description: "How The Construction Project Management Academy collects, uses, and protects your information.",
};

const CONTACT = "support@constructionpmacademy.com";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="July 23, 2026">
      <p>
        This Privacy Policy explains how The Construction Project Management Academy
        (&ldquo;CPMA,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and
        shares information when you use our website, training platform, and the SiteCommand
        training software (together, the &ldquo;Service&rdquo;). By using the Service, you agree to
        the practices described here.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account information</strong> — your name, email address, password (stored only as a secure hash), and company or role details you provide.</li>
        <li><strong>Payment information</strong> — subscription and billing details are processed by our payment provider, Stripe. We do not store your full card number; we retain only limited billing metadata (such as plan, status, and customer identifiers).</li>
        <li><strong>Content you create</strong> — projects, records, messages, uploads, and other data you enter while using the Service, including within training sandboxes.</li>
        <li><strong>Usage information</strong> — log data such as pages viewed, actions taken, device and browser type, and approximate location derived from your IP address.</li>
        <li><strong>Cookies</strong> — we use a small number of cookies necessary to keep you signed in and to operate the Service.</li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>To provide, maintain, and improve the Service and your training experience.</li>
        <li>To create and manage your account and process subscriptions and payments.</li>
        <li>To send transactional messages (for example, invitations, password resets, and assignment notifications).</li>
        <li>To generate AI-assisted features (such as coaching, recommendations, and document assistance) using the content you provide.</li>
        <li>To secure the Service, prevent abuse, and comply with legal obligations.</li>
      </ul>

      <h2>How information is shared</h2>
      <p>We do not sell your personal information. We share information only with service providers that help us operate the Service, and only as needed to do so, including:</p>
      <ul>
        <li><strong>Stripe</strong> — payment processing and subscription billing.</li>
        <li><strong>Supabase</strong> — database and file storage hosting.</li>
        <li><strong>Resend</strong> — transactional email delivery.</li>
        <li><strong>AI providers</strong> — content you submit to AI features may be processed by our model providers (such as Google) to generate responses.</li>
        <li><strong>Accounting integrations</strong> — where you connect an ERP (such as QuickBooks Online or Sage 300 CRE), we exchange the data necessary to sync the records you choose.</li>
      </ul>
      <p>We may also disclose information if required by law, to protect our rights, or in connection with a merger, acquisition, or sale of assets.</p>

      <h2>Data retention</h2>
      <p>
        We retain your information for as long as your account is active and as needed to provide
        the Service, comply with our legal obligations, resolve disputes, and enforce our
        agreements. You may request deletion of your account and associated data as described below.
      </p>

      <h2>Security</h2>
      <p>
        We use administrative, technical, and physical safeguards designed to protect your
        information, including encrypted transport and hashed passwords. No method of transmission
        or storage is completely secure, and we cannot guarantee absolute security.
      </p>

      <h2>Your choices and rights</h2>
      <p>
        Depending on your location, you may have the right to access, correct, export, or delete
        your personal information, and to object to or restrict certain processing. To exercise
        these rights, contact us at <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. You can also update
        your account details from within the Service.
      </p>

      <h2>Children&rsquo;s privacy</h2>
      <p>
        The Service is intended for users 18 and older and is not directed to children. We do not
        knowingly collect personal information from children.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we will revise the
        &ldquo;Last updated&rdquo; date above and, where appropriate, provide additional notice.
      </p>

      <h2>Contact us</h2>
      <p>
        If you have questions about this Privacy Policy or our data practices, contact us at{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </LegalPage>
  );
}
