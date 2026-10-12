// The allowed values for other_gifts.gift_type, with the label shown in
// admin. Shared by the "Other gifts" form's dropdown and its Server
// Action (which re-checks the posted value against this list), so the two
// can't drift apart. Must match the table's CHECK constraint.
export const OTHER_GIFT_TYPES = [
  { value: "item", label: "Item" },
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "gift_card", label: "Gift card" },
  { value: "venmo", label: "Venmo" },
  { value: "other", label: "Other" },
] as const;

export type OtherGiftType = (typeof OTHER_GIFT_TYPES)[number]["value"];

export function otherGiftTypeLabel(value: OtherGiftType): string {
  return OTHER_GIFT_TYPES.find((t) => t.value === value)?.label ?? "Other";
}
