export const COLORS = {
  // Primary/Secondary aligned with the shared tokens idea
  primary: '#4CAF50',        // fresh green
  primaryDark: '#388E3C',    // deep forest green
  secondary: '#607D8B',      // cool slate blue-gray
  secondaryDark: '#455A64',  // darker slate tone
  textHeading: '#1B5E20',    // rich green for readable headings
};

export const GRADIENTS = {
  primary: [COLORS.primary, COLORS.primaryDark] as const,
  secondary: [COLORS.secondary, COLORS.secondaryDark] as const,
};

export type Gradient = readonly [string, string];

