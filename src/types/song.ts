export interface Song {
  id?: string;
  name: string;
  duration: string;
  extra?: string;
  actuality?: string;
  chin?: string;
  popularity?: boolean;
}

export const EXTRA_OPTIONS = [
  { value: "", label: "None" },
  { value: "holidays", label: "Holidays" },
  { value: "christmas", label: "Christmas" },
  { value: "chinNewYear", label: "Chinese New Year" },
] as const;

export const ACTUALITY_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "passive", label: "Passive" },
] as const;
