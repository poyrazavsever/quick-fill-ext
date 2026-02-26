import type { QuickFillState, QuickProfile } from "./types";

const DEFAULT_PROFILE: QuickProfile = {
  id: "profile_default",
  name: "Default",
  items: [
    {
      id: "item_full_name",
      label: "Full Name",
      alias: "name",
      value: "Your Name",
      type: "field",
      shortcut: "ctrl+alt+1",
      starred: false,
    },
    {
      id: "item_email",
      label: "Email",
      alias: "email",
      value: "you@example.com",
      type: "field",
      shortcut: "ctrl+alt+2",
      starred: false,
    },
    {
      id: "item_github",
      label: "GitHub",
      alias: "github",
      value: "https://github.com/your-username",
      type: "link",
      shortcut: "ctrl+alt+3",
      starred: true,
    },
    {
      id: "item_linkedin",
      label: "LinkedIn",
      alias: "linkedin",
      value: "https://linkedin.com/in/your-username",
      type: "link",
      shortcut: "ctrl+alt+4",
      starred: true,
    },
  ],
};

export function createDefaultState(): QuickFillState {
  return {
    activeProfileId: DEFAULT_PROFILE.id,
    profiles: [DEFAULT_PROFILE],
    updatedAt: Date.now(),
  };
}
