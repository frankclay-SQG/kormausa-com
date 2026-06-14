export type ApplicationServiceId =
  | "school-registration"
  | "rank-registration"
  | "instructor-certification";

export type ApplicationFlowId = "standard" | "whmaf-promotion";

export type MartialArtId = "taekwondo" | "hapkido" | "kumdo";

export type DanLevelId =
  | "1st-dan"
  | "2nd-dan"
  | "3rd-dan"
  | "4th-dan"
  | "5th-dan"
  | "6th-dan"
  | "7th-dan"
  | "8th-dan"
  | "9th-dan";

export type DraftStatus = "new" | "draft" | "ready-for-review";

export interface ApplicationFlow {
  id: ApplicationFlowId;
  title: string;
  description: string;
  helperText: string;
  serviceOrder: ApplicationServiceId[];
  lockedServices?: ApplicationServiceId[];
  lockedArts?: MartialArtId[];
}

export interface ApplicationService {
  id: ApplicationServiceId;
  title: string;
  shortTitle: string;
  description: string;
  idealFor: string;
  estimatedMinutes: number;
  pricePlaceholder: string;
  requiredArtifacts: string[];
}

export interface MartialArt {
  id: MartialArtId;
  title: string;
  description: string;
  rankLevels: string[];
}

export interface DanLevelCost {
  id: DanLevelId;
  label: string;
  costPlaceholder: string;
  amountCents?: number;
}

export interface DanTestingRequirement {
  targetDanLevelId: DanLevelId;
  targetLabel: string;
  requiredCurrentDanLevelId: DanLevelId | "";
  requiredCurrentLabel: string;
  minimumYearsAtCurrentRank: number;
  description: string;
}

export interface CredentialDraft {
  artId: MartialArtId;
  currentRank: string;
  issuingOrganization: string;
  yearsTraining: string;
}

export interface SchoolDraft {
  schoolName: string;
  schoolType: "physical" | "mobile" | "online" | "hybrid" | "";
  city: string;
  state: string;
  artsTaught: MartialArtId[];
}

export interface CertificationProfileDraft {
  dateOfBirth: string;
  nation: string;
  sex: "" | "M" | "F";
  citizenNumber: string;
  currentRank: string;
  currentRankIssueDate: string;
  currentRankNumber: string;
  yearsTraining: string;
  currentOrg: string;
  instructorName: string;
  recommenderName: string;
  notes: string;
}

export interface PromotionHistoryEntry {
  id: string;
  artId: MartialArtId | "";
  rankLabel: string;
  promotionDate: string;
  certifyingInstructor: string;
  certifyingOrganization: string;
  certificateNumber: string;
}

export interface TestingEligibilityDraft {
  targetDanLevelId: DanLevelId | "";
  eligibleDate: string;
  reminderStatus: "watch" | "eligible" | "not-ready";
  manualOverride: boolean;
  entryAboveFirst: boolean;
  notes: string;
}

export interface ApplicationRegistration {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  formattedAddress: string;
  googlePlaceId: string;
  googleMapsUri: string;
  addressValidationStatus:
    | "unverified"
    | "validating"
    | "validated"
    | "needs-review"
    | "not-configured";
  addressValidationMessage: string;
  addressValidatedAt: string;
  phone: string;
  email: string;
  allowTexts: boolean;
  allowEmails: boolean;
}

export interface ApplicationDraft {
  id: string;
  status: DraftStatus;
  applicationFlowId: ApplicationFlowId;
  registration: ApplicationRegistration;
  submitterName: string;
  submitterEmail: string;
  certificationProfile: CertificationProfileDraft;
  selectedServices: ApplicationServiceId[];
  selectedArts: MartialArtId[];
  rankDanLevelId: DanLevelId | "";
  promotionHistory: PromotionHistoryEntry[];
  testingEligibility: TestingEligibilityDraft;
  credentials: CredentialDraft[];
  school: SchoolDraft;
  updatedAt: string;
}
