export type QuickItemType = "field" | "link";

export interface QuickItem {
  id: string;
  label: string;
  alias: string;
  value: string;
  type: QuickItemType;
  shortcut: string;
  starred: boolean;
}

export interface QuickProfile {
  id: string;
  name: string;
  items: QuickItem[];
}

export interface QuickFillState {
  activeProfileId: string;
  profiles: QuickProfile[];
  updatedAt: number;
}
