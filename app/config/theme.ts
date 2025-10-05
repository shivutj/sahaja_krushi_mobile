export const COLORS = {
  // Primary/Secondary aligned with the shared tokens idea
  primary: '#2F6E3A', // muted green
  primaryDark: '#3B7D46',
  secondary: '#3F4B53', // muted slate
  secondaryDark: '#4A5A63',
  textHeading: '#1F4D25',
};

export const GRADIENTS = {
  primary: [COLORS.primary, COLORS.primaryDark] as const,
  secondary: [COLORS.secondary, COLORS.secondaryDark] as const,
};

export type Gradient = readonly [string, string];

