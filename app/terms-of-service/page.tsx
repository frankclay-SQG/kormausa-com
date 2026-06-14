import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalList,
  LegalPageShell,
  LegalSection,
} from "@/components/legal-page-shell";

const EFFECTIVE_DATE = "June 14, 2026";

export const metadata: Metadata = {
  title: "Terms of Service | KORMA-USA",
  description:
    "Terms of Service for KORMA-USA covering website use, registrations, applications, payments, and program participation.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      eyebrow="Terms of Service"
      title="Terms of Service"
      effectiveDate={EFFECTIVE_DATE}
      summary="These Terms of Service govern your use of the KORMA-USA website and related online forms, registrations, applications, enrollments, waivers, billing tools, and communications."
    >
      <LegalSection title="1. Acceptance of These Terms">
        <p>
          By accessing or using this website, submitting a form, requesting
          information, registering, applying, enrolling, or using a KORMA-USA
          online workflow, you agree to these Terms of Service and to our{" "}
          <Link
            href="/privacy-policy"
            className="text-korma-gold transition-colors hover:text-korma-gold-light"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility and Authority">
        <p>
          You may use this website only if you have the legal capacity to do
          so. If you are submitting information on behalf of a minor, student,
          school, or organization, you represent that you are authorized to do
          so.
        </p>
      </LegalSection>

      <LegalSection title="3. Website and Service Use">
        <p>
          The site is provided to help visitors learn about KORMA-USA programs,
          request information, submit waivers, start enrollments, and complete
          registration or application workflows. You agree not to use the site:
        </p>
        <LegalList
          items={[
            <>To submit false, misleading, or unauthorized information.</>,
            <>To interfere with site operation, security, or availability.</>,
            <>To upload malicious code or abuse any form, workflow, or communication feature.</>,
            <>To impersonate another person or submit someone else’s information without authorization.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Accuracy of Submitted Information">
        <p>
          You are responsible for providing accurate, current, and complete
          information. KORMA-USA may rely on the information you submit for
          program administration, billing, application review, communications,
          and eligibility tracking.
        </p>
        <p>
          Where the site requires mailing addresses, you agree to provide an
          address that can be validated through the site’s Google-backed address
          validation workflow.
        </p>
      </LegalSection>

      <LegalSection title="5. Applications, Certifications, and Review">
        <p>
          Submission of a registration, application, certification request, or
          related supporting information does not guarantee approval,
          certification, rank recognition, instructor status, or any other
          outcome. KORMA-USA may request additional information, documentation,
          clarification, or review before acting on a submission.
        </p>
      </LegalSection>

      <LegalSection title="6. Billing, Payments, and Pricing">
        <LegalList
          items={[
            <>Program pricing, service fees, billing structures, and payment-plan options may be described on the site or in follow-up communications.</>,
            <>Application billing may be sent to the submitter email address provided in the workflow, with reference copies sent to designated KORMA-USA addresses.</>,
            <>Paid enrollment transactions may be processed through Stripe or another designated payment provider.</>,
            <>Promotional codes, quotes, payment plans, deposits, and approval-based billing remain subject to the specific terms presented at the time they are offered.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Texts, Emails, and Operational Messages">
        <p>
          By selecting communication permissions in the relevant form, you agree
          that KORMA-USA may send operational emails or text messages related to
          class inquiries, enrollment steps, applications, billing, waivers,
          student records, and testing eligibility.
        </p>
      </LegalSection>

      <LegalSection title="8. Waivers, Safety, and Participation">
        <p>
          Participation in martial arts training and related activities may
          require separate waivers, safety acknowledgments, or parental
          approvals. Those documents, when signed, apply in addition to these
          Terms of Service.
        </p>
        <p>
          Nothing on this website is medical advice. You are responsible for
          obtaining any medical guidance appropriate to your circumstances before
          participating in training or related activities.
        </p>
      </LegalSection>

      <LegalSection title="9. Intellectual Property">
        <p>
          The KORMA-USA site content, branding, logos, text, layout, and other
          materials provided on the site are owned by KORMA-USA or used with
          permission. You may not copy, republish, distribute, or exploit site
          materials except as allowed by law or with written permission.
        </p>
      </LegalSection>

      <LegalSection title="10. Third-Party Services and Links">
        <p>
          The site may rely on or link to third-party services, including
          payment processors, mapping and address-validation services, CRM
          systems, scheduling tools, and email infrastructure. KORMA-USA is not
          responsible for the independent terms, privacy practices, or
          availability of third-party services.
        </p>
      </LegalSection>

      <LegalSection title="11. No Guarantee of Availability">
        <p>
          We may modify, suspend, or discontinue any part of the site, any
          online workflow, or any feature at any time. We do not guarantee that
          the site will always be available, error-free, or uninterrupted.
        </p>
      </LegalSection>

      <LegalSection title="12. Disclaimers">
        <p>
          The site and its content are provided on an &quot;as is&quot; and
          &quot;as available&quot; basis. To the fullest extent permitted by
          law, KORMA-USA disclaims warranties of any kind, whether express or
          implied, including implied warranties of merchantability, fitness for
          a particular purpose, and non-infringement.
        </p>
      </LegalSection>

      <LegalSection title="13. Limitation of Liability">
        <p>
          To the fullest extent permitted by law, KORMA-USA will not be liable
          for indirect, incidental, consequential, special, exemplary, or
          punitive damages arising out of or related to your use of the site or
          any online workflow, even if advised of the possibility of such
          damages.
        </p>
      </LegalSection>

      <LegalSection title="14. Governing Law">
        <p>
          These Terms of Service are governed by the laws of the Commonwealth of
          Virginia, without regard to conflict-of-law rules, unless applicable
          law requires otherwise.
        </p>
      </LegalSection>

      <LegalSection title="15. Changes to These Terms">
        <p>
          We may revise these Terms of Service from time to time. If we do, we
          will post the updated version here and revise the effective date.
          Continued use of the site after updated terms are posted constitutes
          acceptance of the revised terms.
        </p>
      </LegalSection>

      <LegalSection title="16. Contact">
        <p>
          Questions about these Terms of Service may be sent to{" "}
          <a
            href="mailto:info@kormausa.com"
            className="text-korma-gold transition-colors hover:text-korma-gold-light"
          >
            info@kormausa.com
          </a>{" "}
          or{" "}
          <a
            href="mailto:masterclay@kormausa.com"
            className="text-korma-gold transition-colors hover:text-korma-gold-light"
          >
            masterclay@kormausa.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
