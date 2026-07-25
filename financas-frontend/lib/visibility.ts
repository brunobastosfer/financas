import type { OwnedRecord, UserId, ViewMode } from "./types";

export function canUserAccess(record: OwnedRecord, userId: UserId) {
  return (
    record.accessMode !== "INDIVIDUAL" ||
    record.ownerId === userId ||
    record.sharedWithFamily === true
  );
}

export function matchesView(
  record: OwnedRecord,
  userId: UserId,
  view: ViewMode,
) {
  if (!canUserAccess(record, userId)) return false;
  if (view === "MINE") {
    return record.accessMode === "INDIVIDUAL" && record.ownerId === userId;
  }
  if (view === "JOINT") {
    return record.accessMode !== "INDIVIDUAL";
  }
  return true;
}

export function visibleRecords<T extends OwnedRecord>(
  records: T[],
  userId: UserId,
  view: ViewMode,
) {
  return records.filter((record) => matchesView(record, userId, view));
}

export function shareForUser(record: OwnedRecord, userId: UserId) {
  if (!canUserAccess(record, userId)) return 0;
  if (record.accessMode === "INDIVIDUAL") return 1;
  if (record.accessMode === "JOINT") return 0.5;
  return (record.ownerId === userId
    ? record.ownerShare
    : record.partnerShare) / 100;
}

export function validateOwnership(
  mode: OwnedRecord["accessMode"],
  ownerShare?: number,
) {
  if (mode === "INDIVIDUAL") {
    return { ownerShare: 100, partnerShare: 0 };
  }
  if (mode === "JOINT") {
    return { ownerShare: 50, partnerShare: 50 };
  }
  if (
    ownerShare === undefined ||
    !Number.isFinite(ownerShare) ||
    ownerShare <= 0 ||
    ownerShare >= 100
  ) {
    throw new Error("A participação parcial deve ficar entre 1% e 99%.");
  }
  return { ownerShare, partnerShare: 100 - ownerShare };
}
