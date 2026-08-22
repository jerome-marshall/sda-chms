import {
  type MARITAL_STATUS_VALUES,
  MEMBERSHIP_STATUS,
  type MEMBERSHIP_STATUS_VALUES,
  SPOUSE_STATE,
  type SPOUSE_STATE_VALUES,
} from "../constants/people";

type SpouseState = (typeof SPOUSE_STATE_VALUES)[number];
type MaritalStatus = (typeof MARITAL_STATUS_VALUES)[number];
type MembershipStatus = (typeof MEMBERSHIP_STATUS_VALUES)[number];

/**
 * An ongoing marriage outranks a past one, so a remarried Person's Marital
 * Status follows the current marriage rather than a divorced/widowed link.
 * Within the same state, the most recently created link wins (issue #8).
 */
const GOVERNING_SPOUSE_STATE_PRIORITY: Record<SpouseState, number> = {
  [SPOUSE_STATE.MARRIED]: 0,
  [SPOUSE_STATE.SEPARATED]: 1,
  [SPOUSE_STATE.WIDOWED]: 2,
  [SPOUSE_STATE.DIVORCED]: 3,
};

/** The fields needed to resolve one spouse link from a Person's perspective. */
export interface SpouseLinkForMaritalStatus {
  createdAt: Date | string;
  partnerDeceased: boolean;
  storedState: SpouseState | null;
}

/**
 * The lifecycle state shown for a spouse link from one person's perspective.
 * Widowhood is derived: if the partner is deceased and the marriage did not end
 * in divorce, the state reads `widowed`; otherwise the stored state stands.
 */
export const resolveSpouseState = (
  storedState: SpouseState | null,
  partnerDeceased: boolean
): SpouseState | null => {
  if (storedState == null) {
    return null;
  }
  if (partnerDeceased && storedState !== SPOUSE_STATE.DIVORCED) {
    return SPOUSE_STATE.WIDOWED;
  }
  return storedState;
};

/** True when the partner's Membership Status is Deceased — the widowhood signal. */
export const isPartnerDeceased = (
  membershipStatus: MembershipStatus
): boolean => membershipStatus === MEMBERSHIP_STATUS.DECEASED;

const createdAtTime = (value: Date | string): number =>
  value instanceof Date ? value.getTime() : new Date(value).getTime();

/**
 * Picks the governing spouse-link state when a Person has several. Prefers
 * married → separated → widowed → divorced, then the most recently created
 * link of that state — "most recent married" when the Person has remarried.
 */
export const selectGoverningSpouseState = (
  links: SpouseLinkForMaritalStatus[]
): SpouseState | null => {
  const resolved = links.flatMap((link) => {
    const state = resolveSpouseState(link.storedState, link.partnerDeceased);
    return state == null ? [] : [{ createdAt: link.createdAt, state }];
  });

  if (resolved.length === 0) {
    return null;
  }

  const [governing] = resolved.sort((a, b) => {
    const byPriority =
      GOVERNING_SPOUSE_STATE_PRIORITY[a.state] -
      GOVERNING_SPOUSE_STATE_PRIORITY[b.state];
    if (byPriority !== 0) {
      return byPriority;
    }
    return createdAtTime(b.createdAt) - createdAtTime(a.createdAt);
  });

  return governing?.state ?? null;
};

/**
 * Maps a spouse-link state onto Marital Status. The values coincide; `single`
 * is only valid when no spouse link governs.
 */
export const maritalStatusFromSpouseState = (
  state: SpouseState
): Exclude<MaritalStatus, "single"> => state;

/**
 * A Person's effective Marital Status: the governing spouse link when one
 * exists, otherwise the stored (manually set) value.
 */
export const effectiveMaritalStatus = (
  stored: MaritalStatus,
  links: SpouseLinkForMaritalStatus[]
): MaritalStatus => {
  const governing = selectGoverningSpouseState(links);
  return governing ? maritalStatusFromSpouseState(governing) : stored;
};
