import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalList,
  LegalPageShell,
  LegalSection,
} from "@/components/legal-page-shell";

const EFFECTIVE_DATE = "June 14, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy | KORMA-USA",
  description:
    "Privacy Policy for KORMA-USA covering contact forms, applications, payments, cookies, and communications.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      effectiveDate={EFFECTIVE_DATE}
      summary="This Privacy Policy explains how KORMA-USA collects, uses, shares, and retains personal information when you use our website, request information, register, apply for services, sign a waiver, enroll in programs, or communicate with us."
    >
      <LegalSection title="Important Notice">
        <p>
          KORMA-USA does <strong>not</strong> sell personally identifiable
          information (PII) or customer data, whether through this website or
          in any other way.
        </p>
        <p>
          KORMA-USA may share limited personally identifiable information as
          reasonably necessary with Korean martial arts governing,
          certifying, or rank-issuing bodies in connection with rank
          registration, certification review, promotion processing, lineage
          verification, and related administrative requirements.
        </p>
      </LegalSection>

      <LegalSection title="1. Scope">
        <p>
          This Privacy Policy applies to information collected through the
          KORMA-USA website, online forms, application workflows, billing
          communications, and related digital services. It is intended to
          describe our current practices as reflected in this website’s live
          features and connected service providers.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>Depending on how you use the site, we may collect:</p>
        <LegalList
          items={[
            <>
              Contact details such as your name, email address, phone number,
              mailing address, and communication preferences.
            </>,
            <>
              Program, inquiry, and registration details, including the martial
              art or service you are interested in, scheduling information,
              prior experience, and free-form messages you submit to us.
            </>,
            <>
              Application and certification information, including selected
              services, rank history, school details, testing-eligibility
              details, uploaded file names, and related submission metadata.
            </>,
            <>
              Waiver and safety information, such as date of birth, emergency
              contact details, guardian details for minors, electronic
              signatures, and photo/video consent choices.
            </>,
            <>
              Enrollment and checkout information, including program selection,
              number of participants, and payment-session metadata.
            </>,
            <>
              Address validation data returned by Google services, including a
              standardized mailing address, Google Place ID, and Google Maps
              link where available.
            </>,
            <>
              Technical and preference data, including cookie-consent choices
              and locally stored application draft data on your device.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. How We Use Information">
        <LegalList
          items={[
            <>Respond to inquiries and provide information about classes, seminars, and services.</>,
            <>Create and maintain contact, inquiry, registration, waiver, and application records.</>,
            <>Process enrollments, billing communications, and related administrative work.</>,
            <>Validate mailing addresses before accepting address-based submissions.</>,
            <>Prevent duplicate records and keep CRM data accurate.</>,
            <>Track certification history, promotion history, and testing eligibility.</>,
            <>Send emails or texts you have authorized, including account, billing, scheduling, and application updates.</>,
            <>Maintain site functionality, security, and record integrity.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Cookies and Local Storage">
        <p>
          KORMA-USA uses a consent mechanism that stores your cookie preferences
          in browser storage and in a site cookie so your selection persists
          across visits.
        </p>
        <LegalList
          items={[
            <>Necessary storage is used to save your consent choice and support core site behavior.</>,
            <>
              Application drafts may be stored locally in your browser for
              convenience before submission.
            </>,
            <>
              Optional analytics and marketing preferences are presented in the
              banner, but those categories are currently off by default and are
              not used to activate analytics or advertising tools unless the
              site is updated to do so.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Third-Party Services We Use">
        <p>
          We use service providers to operate parts of the site and process
          submitted data:
        </p>
        <LegalList
          items={[
            <>
              <strong>HubSpot</strong> for CRM records, inquiry tracking,
              application tracking, and related follow-up workflows.
            </>,
            <>
              <strong>Google Maps / Google Places / Google Address
              Validation</strong> to search, validate, and standardize mailing
              addresses.
            </>,
            <>
              <strong>Stripe</strong> to create checkout sessions for paid
              enrollments. KORMA-USA does not store full payment card details on
              this site.
            </>,
            <>
              <strong>Resend</strong> for application billing emails when that
              billing workflow is used.
            </>,
            <>
              <strong>Vercel and related hosting infrastructure</strong> to host
              and serve the site.
            </>,
          ]}
        />
        <p>
          These providers handle data under their own terms and privacy
          policies. Their use is limited to supporting site operations and our
          program administration.
        </p>
      </LegalSection>

      <LegalSection title="6. How We Share Information">
        <p>
          We do not sell personal information through this website. We may
          share information:
        </p>
        <LegalList
          items={[
            <>With service providers that process data on our behalf to run the site and support KORMA-USA operations.</>,
            <>Within KORMA-USA for program administration, applicant review, billing, testing eligibility, and student support.</>,
            <>When required to comply with law, legal process, or to protect rights, safety, or site security.</>,
          ]}
        />
        <p>
          Based on the current implementation of this site, we do not currently
          use the website to sell personal information or share personal
          information for cross-context behavioral advertising as those terms
          are commonly used in U.S. privacy laws.
        </p>
      </LegalSection>

      <LegalSection title="7. Text and Email Permissions">
        <p>
          Certain forms require you to affirmatively authorize text messages,
          emails, or both. Those permissions are used for operational
          communications such as application updates, billing notices, testing
          reminders, scheduling, and requested class information.
        </p>
      </LegalSection>

      <LegalSection title="8. Minors">
        <p>
          KORMA-USA provides services involving minors. When information is
          submitted for a minor, we may collect parent or guardian contact
          details, emergency contact information, guardian signatures, and other
          related records needed for participation, safety, and program
          administration.
        </p>
      </LegalSection>

      <LegalSection title="9. Data Retention">
        <p>
          We retain information for as long as reasonably necessary to operate
          programs, manage student and applicant records, support billing,
          document waivers and permissions, maintain promotion history, and
          satisfy legal, operational, or recordkeeping needs.
        </p>
      </LegalSection>

      <LegalSection title="10. Security">
        <p>
          We use reasonable administrative and technical measures to protect
          personal information, but no internet transmission or storage system
          is guaranteed to be completely secure. You should avoid sending
          information through the site that you would not want transmitted
          electronically unless it is required for the service you are
          requesting.
        </p>
      </LegalSection>

      <LegalSection title="11. Your Choices and Rights">
        <p>
          You may contact us to request updates or corrections to your
          information, ask questions about records we maintain, or request that
          we review a deletion request where appropriate.
        </p>
        <p>
          California residents may also have additional privacy rights under
          California law, depending on the nature of the information and our
          role in processing it.
        </p>
      </LegalSection>

      <LegalSection title="12. Policy Changes">
        <p>
          We may update this Privacy Policy from time to time. If we make
          material changes, we will update the effective date on this page and
          post the revised version here.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact Us">
        <p>
          Questions or privacy requests can be sent to{" "}
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
        <p>
          You may also review our{" "}
          <Link
            href="/terms-of-service"
            className="text-korma-gold transition-colors hover:text-korma-gold-light"
          >
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
