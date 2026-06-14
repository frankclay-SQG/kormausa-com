import type {
  ApplicationFlow,
  ApplicationFlowId,
  ApplicationService,
  ApplicationServiceId,
  DanTestingRequirement,
  DanLevelCost,
  DanLevelId,
  MartialArt,
  MartialArtId,
} from "@/lib/application/types";

const STANDARD_SERVICE_ORDER: ApplicationServiceId[] = [
  "school-registration",
  "rank-registration",
  "instructor-certification",
];

const WHMAF_SERVICE_ORDER: ApplicationServiceId[] = [
  "rank-registration",
  "instructor-certification",
  "school-registration",
];

export const APPLICATION_FLOWS: ApplicationFlow[] = [
  {
    id: "standard",
    title: "KORMA-USA Standard",
    description:
      "Flexible KORMA-USA application flow for school registration, rank registration, and instructor certification.",
    helperText:
      "Choose the services and martial arts involved, then complete the shared registration and application details.",
    serviceOrder: STANDARD_SERVICE_ORDER,
  },
  {
    id: "whmaf-promotion",
    title: "WHMAF Promotion Submission",
    description:
      "Official WHMAF promotion packet with rank, instructor, and organization forms completed in the required order.",
    helperText:
      "This path uses WHMAF promotion wording, locks the application order, and applies WHMAF-specific pricing.",
    serviceOrder: WHMAF_SERVICE_ORDER,
    lockedServices: WHMAF_SERVICE_ORDER,
    lockedArts: ["hapkido"],
  },
];

export const APPLICATION_SERVICES: ApplicationService[] = [
  {
    id: "school-registration",
    title: "School Registration",
    shortTitle: "School",
    description:
      "Register a dojang, school, mobile program, online school, or hybrid martial arts organization with KORMA-USA.",
    idealFor: "School owners and program directors",
    estimatedMinutes: 12,
    pricePlaceholder: "$___ school registration fee",
    requiredArtifacts: [
      "School details",
      "Owner and head instructor details",
      "Arts taught",
      "Supporting documents",
    ],
  },
  {
    id: "rank-registration",
    title: "Rank Registration",
    shortTitle: "Rank",
    description:
      "Submit current rank, lineage, issuing organization, and evidence for KORMA-USA review and recognition.",
    idealFor: "Practitioners with existing credentials",
    estimatedMinutes: 10,
    pricePlaceholder: "$___ per rank registration",
    requiredArtifacts: [
      "Current rank",
      "Issuing instructor or organization",
      "Certificate or evidence upload",
      "Lineage notes",
    ],
  },
  {
    id: "instructor-certification",
    title: "Instructor Certification",
    shortTitle: "Instructor",
    description:
      "Apply for instructor certification tied to a selected martial art and supporting rank history.",
    idealFor: "Current and prospective instructors",
    estimatedMinutes: 15,
    pricePlaceholder: "$___ instructor certification fee",
    requiredArtifacts: [
      "Teaching history",
      "Training history",
      "Supporting rank",
      "Current school affiliation",
    ],
  },
];

export const MARTIAL_ARTS: MartialArt[] = [
  {
    id: "taekwondo",
    title: "Taekwondo Changmookwan",
    description:
      "Changmookwan Taekwondo lineage with forms, sparring, and disciplined striking.",
    rankLevels: [
      "White Belt",
      "Yellow Belt",
      "Orange Belt",
      "Green Belt",
      "Blue Belt",
      "Purple Belt",
      "Brown Belt",
      "Red Belt",
      "Black Belt - 1st Dan",
      "Black Belt - 2nd Dan",
      "Black Belt - 3rd Dan",
      "Black Belt - 4th Dan",
      "Black Belt - 5th Dan",
      "Black Belt - 6th Dan",
      "Black Belt - 7th Dan",
      "Black Belt - 8th Dan",
      "Black Belt - 9th Dan",
    ],
  },
  {
    id: "hapkido",
    title: "Hapkido Migukyongkwan",
    description:
      "Migukyongkwan Hapkido self-defense using joint locks, throws, kicks, and strikes.",
    rankLevels: [
      "White Belt",
      "Yellow Belt",
      "Green Belt",
      "Blue Belt",
      "Red Belt",
      "Black Belt - 1st Dan",
      "Black Belt - 2nd Dan",
      "Black Belt - 3rd Dan",
      "Black Belt - 4th Dan",
      "Black Belt - 5th Dan",
      "Black Belt - 6th Dan",
      "Black Belt - 7th Dan",
      "Black Belt - 8th Dan",
      "Black Belt - 9th Dan",
    ],
  },
  {
    id: "kumdo",
    title: "Kumdo",
    description: "Korean sword art focused on discipline, precision, and form.",
    rankLevels: [
      "Beginner",
      "Intermediate",
      "Advanced",
      "1st Dan",
      "2nd Dan",
      "3rd Dan",
      "4th Dan",
      "5th Dan",
      "6th Dan",
      "7th Dan",
      "8th Dan",
      "9th Dan",
    ],
  },
];

export const DAN_LEVEL_COSTS: DanLevelCost[] = [
  {
    id: "1st-dan",
    label: "1st Dan",
    costPlaceholder: "$___ 1st Dan registration",
  },
  {
    id: "2nd-dan",
    label: "2nd Dan",
    costPlaceholder: "$___ 2nd Dan registration",
  },
  {
    id: "3rd-dan",
    label: "3rd Dan",
    costPlaceholder: "$___ 3rd Dan registration",
  },
  {
    id: "4th-dan",
    label: "4th Dan",
    costPlaceholder: "$___ 4th Dan registration",
  },
  {
    id: "5th-dan",
    label: "5th Dan",
    costPlaceholder: "$___ 5th Dan registration",
  },
  {
    id: "6th-dan",
    label: "6th Dan",
    costPlaceholder: "$___ 6th Dan registration",
  },
  {
    id: "7th-dan",
    label: "7th Dan",
    costPlaceholder: "$___ 7th Dan registration",
  },
  {
    id: "8th-dan",
    label: "8th Dan",
    costPlaceholder: "$___ 8th Dan registration",
  },
  {
    id: "9th-dan",
    label: "9th Dan",
    costPlaceholder: "$___ 9th Dan registration",
  },
];

const WHMAF_PRICE_MARKUP = 1.4;

const WHMAF_SERVICE_PRICE_CENTS: Partial<Record<ApplicationServiceId, number>> = {
  "school-registration": markedUpUsd(300),
  "instructor-certification": markedUpUsd(300),
};

const WHMAF_DAN_LEVEL_PRICE_CENTS: Partial<Record<DanLevelId, number>> = {
  "1st-dan": markedUpUsd(70),
  "2nd-dan": markedUpUsd(90),
  "3rd-dan": markedUpUsd(120),
  "4th-dan": markedUpUsd(150),
  "5th-dan": markedUpUsd(300),
  "6th-dan": markedUpUsd(350),
  "7th-dan": markedUpUsd(450),
  "8th-dan": markedUpUsd(500),
  "9th-dan": markedUpUsd(600),
};

export const DAN_TESTING_REQUIREMENTS: DanTestingRequirement[] = [
  {
    targetDanLevelId: "1st-dan",
    targetLabel: "1st Dan",
    requiredCurrentDanLevelId: "",
    requiredCurrentLabel: "Entry review",
    minimumYearsAtCurrentRank: 0,
    description: "Entry-level Dan review.",
  },
  {
    targetDanLevelId: "2nd-dan",
    targetLabel: "2nd Dan",
    requiredCurrentDanLevelId: "1st-dan",
    requiredCurrentLabel: "1st Dan",
    minimumYearsAtCurrentRank: 1,
    description: "Requires 1 year at 1st Dan.",
  },
  {
    targetDanLevelId: "3rd-dan",
    targetLabel: "3rd Dan",
    requiredCurrentDanLevelId: "2nd-dan",
    requiredCurrentLabel: "2nd Dan",
    minimumYearsAtCurrentRank: 2,
    description: "Requires 2 years at 2nd Dan.",
  },
  {
    targetDanLevelId: "4th-dan",
    targetLabel: "4th Dan",
    requiredCurrentDanLevelId: "3rd-dan",
    requiredCurrentLabel: "3rd Dan",
    minimumYearsAtCurrentRank: 3,
    description: "Requires 3 years at 3rd Dan.",
  },
  {
    targetDanLevelId: "5th-dan",
    targetLabel: "5th Dan",
    requiredCurrentDanLevelId: "4th-dan",
    requiredCurrentLabel: "4th Dan",
    minimumYearsAtCurrentRank: 4,
    description: "Requires 4 years at 4th Dan.",
  },
  {
    targetDanLevelId: "6th-dan",
    targetLabel: "6th Dan",
    requiredCurrentDanLevelId: "5th-dan",
    requiredCurrentLabel: "5th Dan",
    minimumYearsAtCurrentRank: 5,
    description: "Requires 5 years at 5th Dan.",
  },
  {
    targetDanLevelId: "7th-dan",
    targetLabel: "7th Dan",
    requiredCurrentDanLevelId: "6th-dan",
    requiredCurrentLabel: "6th Dan",
    minimumYearsAtCurrentRank: 6,
    description: "Requires 6 years at 6th Dan.",
  },
  {
    targetDanLevelId: "8th-dan",
    targetLabel: "8th Dan",
    requiredCurrentDanLevelId: "7th-dan",
    requiredCurrentLabel: "7th Dan",
    minimumYearsAtCurrentRank: 8,
    description: "Requires 8 years at 7th Dan.",
  },
  {
    targetDanLevelId: "9th-dan",
    targetLabel: "9th Dan",
    requiredCurrentDanLevelId: "8th-dan",
    requiredCurrentLabel: "8th Dan",
    minimumYearsAtCurrentRank: 9,
    description: "Requires 9 years at 8th Dan.",
  },
];

export function getService(id: ApplicationServiceId) {
  return APPLICATION_SERVICES.find((service) => service.id === id);
}

export function getMartialArt(id: MartialArtId) {
  return MARTIAL_ARTS.find((art) => art.id === id);
}

export function getApplicationFlow(id: ApplicationFlowId) {
  return APPLICATION_FLOWS.find((flow) => flow.id === id);
}

export function getFlowService(
  flowId: ApplicationFlowId,
  serviceId: ApplicationServiceId
) {
  const service = getService(serviceId);
  if (!service) return undefined;

  if (flowId !== "whmaf-promotion") {
    return service;
  }

  switch (serviceId) {
    case "rank-registration":
      return {
        ...service,
        title: "Application for Promotion Test",
        shortTitle: "Promotion",
        description:
          "Complete the official WHMAF promotion-test application for the selected Dan level.",
        idealFor: "WHMAF promotion applicants",
        pricePlaceholder: "Dan-level promotion fee",
        requiredArtifacts: [
          "Nation, sex, and date of birth",
          "Present rank, issue date, and rank number",
          "Passport-size photo",
          "Current certificate",
        ],
      };
    case "instructor-certification":
      return {
        ...service,
        title: "Instructor Promotion Test",
        shortTitle: "Instructor",
        description:
          "Complete the official WHMAF instructor promotion form in the second step of the packet.",
        idealFor: "WHMAF instructor applicants",
        pricePlaceholder: formatUsd(WHMAF_SERVICE_PRICE_CENTS[serviceId] ?? 0),
        requiredArtifacts: [
          "Instructor promotion form",
          "Recommender details",
          "Dojang name",
          "Supporting rank evidence",
        ],
      };
    case "school-registration":
      return {
        ...service,
        title: "Organization Registration",
        shortTitle: "Organization",
        description:
          "Complete the official WHMAF organization registration form after the promotion and instructor steps.",
        idealFor: "WHMAF affiliated schools and gymnasiums",
        pricePlaceholder: formatUsd(WHMAF_SERVICE_PRICE_CENTS[serviceId] ?? 0),
        requiredArtifacts: [
          "Gymnasium name",
          "Master name",
          "Gym address and telephone",
          "Organization registration signature",
        ],
      };
    default:
      return service;
  }
}

export function orderServiceIdsForFlow(
  flowId: ApplicationFlowId,
  selectedServiceIds: ApplicationServiceId[]
) {
  const flow = getApplicationFlow(flowId);
  const preferredOrder = flow?.serviceOrder ?? STANDARD_SERVICE_ORDER;
  const selected = new Set(selectedServiceIds);

  return preferredOrder.filter((serviceId) => selected.has(serviceId));
}

export function getDanLevelCost(
  id: DanLevelId | "",
  flowId: ApplicationFlowId = "standard"
) {
  if (!id) return undefined;
  const level = DAN_LEVEL_COSTS.find((entry) => entry.id === id);
  if (!level) return undefined;

  if (flowId !== "whmaf-promotion") {
    return level;
  }

  const amountCents = WHMAF_DAN_LEVEL_PRICE_CENTS[id];
  return {
    ...level,
    amountCents,
    costPlaceholder: amountCents
      ? `${formatUsd(amountCents)} promotion fee`
      : "Promotion fee to be configured",
  };
}

export function getDanTestingRequirement(id: DanLevelId | "") {
  if (!id) return undefined;
  return DAN_TESTING_REQUIREMENTS.find(
    (requirement) => requirement.targetDanLevelId === id
  );
}

export function formatUsd(amountCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);
}

function markedUpUsd(amount: number) {
  return Math.round(amount * WHMAF_PRICE_MARKUP * 100);
}

export function getServiceAmountCents(
  flowId: ApplicationFlowId,
  serviceId: ApplicationServiceId
) {
  if (flowId !== "whmaf-promotion") {
    return undefined;
  }

  return WHMAF_SERVICE_PRICE_CENTS[serviceId];
}
