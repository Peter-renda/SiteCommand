import type { Metadata } from "next";
import LegalPage from "@/app/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — CPMA",
  description: "The terms that govern your use of The Construction Project Management Academy.",
};

const CONTACT = "support@constructionpmacademy.com";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="July 23, 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the website,
        training platform, and SiteCommand training software (together, the &ldquo;Service&rdquo;)
        provided by The Construction Project Management Academy (&ldquo;CPMA,&rdquo; &ldquo;we,&rdquo;
        &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By creating an account or using the Service, you agree
        to these Terms.
      </p>

      <h2>The Service</h2>
      <p>
        CPMA is an educational platform that teaches construction project management through
        lessons and hands-on, sandboxed practice. SiteCommand is training software used within the
        Service to simulate running real-world projects. The Service is provided for learning
        purposes and does not constitute professional, legal, financial, or engineering advice.
      </p>

      <h2>Eligibility and accounts</h2>
      <p>
        You must be at least 18 years old to use the Service. You are responsible for the accuracy
        of your account information, for keeping your password confidential, and for all activity
        that occurs under your account. Notify us promptly of any unauthorized use.
      </p>

      <h2>Subscriptions, trials, and billing</h2>
      <ul>
        <li>Paid plans may begin with a free trial. Unless you cancel before the trial ends, your subscription will convert to a paid subscription and your payment method will be charged.</li>
        <li>Subscriptions renew automatically for the plan term until cancelled. You can cancel at any time; cancellation takes effect at the end of the current billing period.</li>
        <li>Fees are billed through our payment provider, Stripe. Except where required by law, payments are non-refundable.</li>
        <li>We may change plans or pricing prospectively; we will provide notice of material changes.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose or in violation of these Terms.</li>
        <li>Attempt to gain unauthorized access to the Service, other accounts, or our systems.</li>
        <li>Interfere with or disrupt the integrity or performance of the Service.</li>
        <li>Reverse engineer, resell, or copy the Service except as permitted by law.</li>
        <li>Upload content that is unlawful, infringing, or harmful.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You retain ownership of the content you create in the Service. You grant us a limited
        license to host, process, and display that content as necessary to operate and improve the
        Service, including generating AI-assisted features from the content you submit.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The Service, including its curriculum, software, and branding, is owned by CPMA and its
        licensors and is protected by intellectual property laws. Except for the rights expressly
        granted to you, we reserve all rights in the Service.
      </p>

      <h2>Third-party services</h2>
      <p>
        The Service integrates with third-party providers (such as Stripe, Supabase, email
        delivery, AI model providers, and accounting integrations you choose to connect). Your use
        of those services may be subject to their own terms, and we are not responsible for their
        acts or omissions.
      </p>

      <h2>Disclaimers</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties
        of any kind, whether express or implied, including fitness for a particular purpose and
        non-infringement. Training content and AI-generated outputs may contain inaccuracies and
        should not be relied upon as professional advice for real projects.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, CPMA will not be liable for any indirect,
        incidental, special, consequential, or punitive damages, or for lost profits or data,
        arising from or related to your use of the Service. Our total liability for any claim will
        not exceed the amount you paid us in the twelve months before the claim.
      </p>

      <h2>Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate your access if you
        violate these Terms or if necessary to protect the Service or other users. Upon termination,
        the provisions that by their nature should survive will continue to apply.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of the United States and the state in which CPMA is
        established, without regard to conflict-of-laws principles.
      </p>

      <h2>Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. When we do, we will revise the &ldquo;Last
        updated&rdquo; date above. Your continued use of the Service after changes take effect
        constitutes acceptance of the revised Terms.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about these Terms? Contact us at <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </LegalPage>
  );
}
