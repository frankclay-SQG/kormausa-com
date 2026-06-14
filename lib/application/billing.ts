import {
  APPLICATION_SERVICES,
  formatUsd,
  getDanLevelCost,
  getFlowService,
  getServiceAmountCents,
  getService,
  orderServiceIdsForFlow,
} from "@/lib/application/catalog";
import type {
  ApplicationFlowId,
  ApplicationServiceId,
  DanLevelId,
} from "@/lib/application/types";

export const REFERENCE_BILLING_EMAIL = "masterclay@kormausa.com";
export const PAYMENT_PLAN_DOWN_PAYMENT_RATE = "10%";
export const PAYMENT_PLAN_INTEREST_RATE = "5%";

export interface BillingRequest {
  applicationId?: string;
  applicationFlowId?: ApplicationFlowId;
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
  applicationFlowId: ApplicationFlowId;
  submitterEmail: string;
  submitterName: string;
  referenceEmail: string;
  lines: BillLine[];
  totalPlaceholder: string;
  totalAmountCents?: number;
  paymentPlan: PaymentPlanDisclosure;
}

export function isValidBillingEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function buildApplicationBill(request: BillingRequest): GeneratedBill {
  const applicationId =
    request.applicationId?.trim() || `korma-${Date.now().toString(36)}`;
  const applicationFlowId = request.applicationFlowId ?? "standard";
  const submitterEmail = request.submitterEmail.trim();
  const submitterName = request.submitterName?.trim() || "KORMA-USA applicant";
  const selectedIds = normalizeSelectedServices(
    orderServiceIdsForFlow(applicationFlowId, request.selectedServices)
  );
  const selectedDanLevel = getDanLevelCost(
    request.rankDanLevelId ?? "",
    applicationFlowId
  );

  const lines = selectedIds
    .map((serviceId) => {
      const service =
        getFlowService(applicationFlowId, serviceId) ?? getService(serviceId);
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

      const amountCents = getServiceAmountCents(applicationFlowId, service.id);
      return {
        label: service.title,
        amountPlaceholder: amountCents
          ? formatUsd(amountCents)
          : service.pricePlaceholder,
      };
    })
    .filter((line): line is BillLine => Boolean(line));

  const knownAmounts = selectedIds.map((serviceId) => {
    if (serviceId === "rank-registration") {
      return selectedDanLevel?.amountCents;
    }
    return getServiceAmountCents(applicationFlowId, serviceId);
  });
  const totalAmountCents = knownAmounts.every((amount) => typeof amount === "number")
    ? knownAmounts.reduce((sum, amount) => sum + (amount ?? 0), 0)
    : undefined;

  return {
    applicationId,
    applicationFlowId,
    submitterEmail,
    submitterName,
    referenceEmail: REFERENCE_BILLING_EMAIL,
    lines,
    totalPlaceholder: totalAmountCents
      ? formatUsd(totalAmountCents)
      : "Calculated after remaining pricing is configured",
    totalAmountCents,
    paymentPlan: buildPaymentPlanDisclosure(totalAmountCents),
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

function buildPaymentPlanDisclosure(
  totalAmountCents?: number
): PaymentPlanDisclosure {
  const downPaymentCents =
    typeof totalAmountCents === "number"
      ? Math.round(totalAmountCents * 0.1)
      : undefined;
  const interestCents =
    typeof totalAmountCents === "number"
      ? Math.round(totalAmountCents * 0.05)
      : undefined;
  const balanceCents =
    typeof totalAmountCents === "number" &&
    typeof downPaymentCents === "number" &&
    typeof interestCents === "number"
      ? totalAmountCents + interestCents - downPaymentCents
      : undefined;

  return {
    title: "Multiple-payment subscription",
    downPaymentRate: PAYMENT_PLAN_DOWN_PAYMENT_RATE,
    interestRate: PAYMENT_PLAN_INTEREST_RATE,
    downPaymentPlaceholder:
      typeof downPaymentCents === "number"
        ? formatUsd(downPaymentCents)
        : `${PAYMENT_PLAN_DOWN_PAYMENT_RATE} of approved bill subtotal`,
    interestPlaceholder:
      typeof interestCents === "number"
        ? formatUsd(interestCents)
        : `${PAYMENT_PLAN_INTEREST_RATE} added to approved bill subtotal`,
    subscriptionBalancePlaceholder:
      typeof balanceCents === "number"
        ? formatUsd(balanceCents)
        : "Approved bill subtotal + interest - down payment",
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
