import { describe, expect, it } from "vitest";
import { shareForUser, validateOwnership, visibleRecords } from "./visibility";
import type { OwnedRecord } from "./types";

const records: OwnedRecord[] = [
  {
    id: "mine",
    accessMode: "INDIVIDUAL",
    ownerId: "helena",
    ownerShare: 100,
    partnerShare: 0,
  },
  {
    id: "partner",
    accessMode: "INDIVIDUAL",
    ownerId: "gabriel",
    ownerShare: 100,
    partnerShare: 0,
  },
  {
    id: "partner-shared",
    accessMode: "INDIVIDUAL",
    ownerId: "gabriel",
    ownerShare: 100,
    partnerShare: 0,
    sharedWithFamily: true,
  },
  {
    id: "joint",
    accessMode: "JOINT",
    ownerId: "gabriel",
    ownerShare: 50,
    partnerShare: 50,
  },
  {
    id: "partial",
    accessMode: "PARTIAL",
    ownerId: "helena",
    ownerShare: 65,
    partnerShare: 35,
  },
];

describe("visibility policy", () => {
  it("never exposes the partner individual records", () => {
    expect(visibleRecords(records, "helena", "ALL").map((item) => item.id)).toEqual([
      "mine",
      "partner-shared",
      "joint",
      "partial",
    ]);
  });

  it("separates personal and couple views", () => {
    expect(visibleRecords(records, "helena", "MINE").map((item) => item.id)).toEqual([
      "mine",
    ]);
    expect(visibleRecords(records, "helena", "JOINT").map((item) => item.id)).toEqual([
      "joint",
      "partial",
    ]);
  });

  it("calculates the partial participation for each partner", () => {
    expect(shareForUser(records[4], "helena")).toBe(0.65);
    expect(shareForUser(records[4], "gabriel")).toBe(0.35);
  });

  it("normalizes ownership shares", () => {
    expect(validateOwnership("JOINT")).toEqual({
      ownerShare: 50,
      partnerShare: 50,
    });
    expect(validateOwnership("PARTIAL", 60)).toEqual({
      ownerShare: 60,
      partnerShare: 40,
    });
    expect(() => validateOwnership("PARTIAL", 100)).toThrow();
  });
});
