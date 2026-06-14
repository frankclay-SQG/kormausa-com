import {
  APPLICATION_SERVICES,
  getDanLevelCost,
  getService,
} from "@/lib/application/catalog";
import type {
  ApplicationServiceId,
  DanLevelId,
} from "@/lib/application/types";

export const REFERENCE_BILLING_EMAIL = "masterclay@kormausa.com";
export const PAYMENT_PLAN_DOWN_PAYMENT_RATE = "10%";
export const PAYMENT_PLAN_INTEREST_RATE = "5%";

export interface BillingRequest {
  applicationId?: string;
  submitterEmail: string;
  submitterName?: string;
  selectedServices: ApplicationServiceId[];
  rankDanLevelId?: DanLevelId | "";
}

export interface BillLine {
  label: string;
  amountPlaceholder: string;
}

export interface PaymentPlanDisclosure {
  title: string;
  downPaymentRate: string;
  interestRate: string;
  downPaymentPlaceholder: string;
  interestPlaceholder: string;
  subscriptionBalancePlaceholder: string;
  disclosure: string;
}

export interface GeneratedBill {
  applicationId: string;
  submitterEmail: string;
  submitterName: string;
  referenceEmail: string;
  lines: BillLine[];
  totalPlaceholder: string;
  paymentPlan: PaymentPlanDisclosure;
}

export function isValidBillingEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function buildApplicationBill(request: BillingRequest): GeneratedBill {
  const applicationId =
    request.applicationId?.trim() || `korma-${Date.now().toString(36)}`;
  const submitterEmail = request.submitterEmail.trim();
  const submitterName = request.submitterName?.trim() || "KORMA-USA applicant";
  const selectedIds = normalizeSelectedServices(request.selectedServices);
  const selectedDanLevel = getDanLevelCost(request.rankDanLevelId ?? "");

  const lines = selectedIds
    .map((serviceId) => {
      const service = getService(serviceId);
      if (!service) return null;

      if (service.id === "rank-registration") {
        return {
          label: selectedDanLevel
            ? `${service.title} - ${selectedDanLevel.label}`
            : service.title,
          amountPlaceholder:
            selectedDanLevel?.costPlaceholder ?? "Dan level cost required",
        };
      }

      return {
        label: service.title,
        amountPlaceholder: service.pricePlaceholder,
      };
    })
    .filter((line): line is BillLine => Boolean(line));

  return {
    applicationId,
    submitterEmail,
    submitterName,
    referenceEmail: REFERENCE_BILLING_EMAIL,
    lines,
    totalPlaceholder: "Calculated after pricing is configured",
    paymentPlan: buildPaymentPlanDisclosure(),
  };
}

export function buildBillingSubject(bill: GeneratedBill) {
  return `KORMA-USA application bill ${bill.applicationId}`;
}

export function buildBillingHtml(bill: GeneratedBill) {
  const lines = bill.lines
    .map(
      (line) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(line.label)}</td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;">${escapeHtml(line.amountPlaceholder)}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
      <h1 style="margin:0 0 12px;font-size:24px;">KORMA-USA Application Bill</h1>
      <p style="margin:0 0 20px;">Application reference: <strong>${escapeHtml(bill.applicationId)}</strong></p>
      <p style="margin:0 0 20px;">Submitter: ${escapeHtml(bill.submitterName)} &lt;${escapeHtml(bill.submitterEmail)}&gt;</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
        <tbody>${lines}</tbody>
        <tfoot>
          <tr>
            <td style="padding:12px 0;font-weight:700;">Estimated total</td>
            <td style="padding:12px 0;text-align:right;font-weight:700;">${escapeHtml(bill.totalPlaceholder)}</td>
          </tr>
        </tfoot>
      </table>
      <div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;margin:0 0 20px;">
        <h2 style="margin:0 0 8px;font-size:18px;">${escapeHtml(bill.paymentPlan.title)}</h2>
        <p style="margin:0 0 8px;">Down payment: <strong>${escapeHtml(bill.paymentPlan.downPaymentPlaceholder)}</strong></p>
        <p style="margin:0 0 8px;">Interest: <strong>${escapeHtml(bill.paymentPlan.interestPlaceholder)}</strong></p>
        <p style="margin:0 0 8px;">Subscription balance: <strong>${escapeHtml(bill.paymentPlan.subscriptionBalancePlaceholder)}</strong></p>
        <p style="margin:0;color:#4b5563;">${escapeHtml(bill.paymentPlan.disclosure)}</p>
      </div>
      <p style="margin:0;color:#4b5563;">A reference copy was sent to ${escapeHtml(bill.referenceEmail)}.</p>
    </div>`;
}

function buildPaymentPlanDisclosure(): PaymentPlanDisclosure {
  return {
    title: "Multiple-payment subscription",
    downPaymentRate: PAYMENT_PLAN_DOWN_PAYMENT_RATE,
    interestRate: PAYMENT_PLAN_INTEREST_RATE,
    downPaymentPlaceholder: `${PAYMENT_PLAN_DOWN_PAYMENT_RATE} of approved bill subtotal`,
    interestPlaceholder: `${PAYMENT_PLAN_INTEREST_RATE} added to approved bill subtotal`,
    subscriptionBalancePlaceholder:
      "Approved bill subtotal + interest - down payment",
    disclosure:
      "If the bill is split into multiple payments, the subscription must disclose the down payment, the added interest, and the remaining balance before the applicant accepts.",
  };
}

function normalizeSelectedServices(serviceIds: ApplicationServiceId[]) {
  const validIds = new Set(APPLICATION_SERVICES.map((service) => service.id));
  return Array.from(
    new Set(serviceIds.filter((serviceId) => validIds.has(serviceId)))
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
