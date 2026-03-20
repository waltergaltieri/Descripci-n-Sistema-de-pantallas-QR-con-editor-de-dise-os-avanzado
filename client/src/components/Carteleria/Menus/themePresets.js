export const themePresets = [
  {
    key: 'style-1',
    label: 'Clasico',
    background: 'linear-gradient(180deg, #fff8ef 0%, #ffffff 100%)',
    headerBackground: '#1f2937',
    headerText: '#ffffff',
    accent: '#c2410c',
    cardBackground: '#ffffff'
  },
  {
    key: 'style-2',
    label: 'Bistro',
    background: 'linear-gradient(180deg, #f4f1ea 0%, #fffdf8 100%)',
    headerBackground: '#7c2d12',
    headerText: '#fff7ed',
    accent: '#b45309',
    cardBackground: '#fffaf3'
  },
  {
    key: 'style-3',
    label: 'Moderno',
    background: 'linear-gradient(180deg, #ecfeff 0%, #f8fafc 100%)',
    headerBackground: '#164e63',
    headerText: '#ecfeff',
    accent: '#0891b2',
    cardBackground: '#ffffff'
  },
  {
    key: 'style-4',
    label: 'Solar',
    background: 'linear-gradient(180deg, #fffbeb 0%, #fff7ed 100%)',
    headerBackground: '#9a3412',
    headerText: '#fff7ed',
    accent: '#ea580c',
    cardBackground: '#ffffff'
  },
  {
    key: 'style-5',
    label: 'Verde local',
    background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
    headerBackground: '#166534',
    headerText: '#f0fdf4',
    accent: '#16a34a',
    cardBackground: '#ffffff'
  },
  {
    key: 'style-6',
    label: 'Nocturno',
    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
    headerBackground: '#020617',
    headerText: '#e2e8f0',
    accent: '#38bdf8',
    cardBackground: 'rgba(15, 23, 42, 0.85)'
  }
];

export const getThemePreset = (themeKey) =>
  themePresets.find((theme) => theme.key === themeKey) || themePresets[0];

export const getThemeTextColors = (themeConfig) => {
  const theme = themeConfig?.key ? themeConfig : getThemePreset(themeConfig);

  if (theme.key === 'style-6') {
    return {
      body: '#e2e8f0',
      muted: '#cbd5e1'
    };
  }

  return {
    body: '#111827',
    muted: '#4b5563'
  };
};
