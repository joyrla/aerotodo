export type ThemeName = 'default' | 'mint';

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  cssVariables: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export const themes: Record<ThemeName, ThemeConfig> = {
  default: {
    name: 'default',
    label: 'Default',
    cssVariables: {
      light: {
        '--background': 'oklch(0.9702 0 0)',
        '--foreground': 'oklch(0.2350 0 0)',
        '--card': 'oklch(1.0000 0 0)',
        '--card-foreground': 'oklch(0.2350 0 0)',
        '--popover': 'oklch(1.0000 0 0)',
        '--popover-foreground': 'oklch(0.2350 0 0)',
        '--primary': 'oklch(0.6723 0.1606 244.9955)',
        '--primary-foreground': 'oklch(1.0000 0 0)',
        '--secondary': 'oklch(0.9203 0.0174 248.0164)',
        '--secondary-foreground': 'oklch(0.5025 0.1459 253.4388)',
        '--muted': 'oklch(0.9249 0 0)',
        '--muted-foreground': 'oklch(0.5032 0 0)',
        '--accent': 'oklch(0.8898 0.0175 248.0246)',
        '--accent-foreground': 'oklch(0.5025 0.1459 253.4388)',
        '--destructive': 'oklch(0.5514 0.1870 25.8442)',
        '--destructive-foreground': 'oklch(1.0000 0 0)',
        '--border': 'oklch(0.8638 0 0)',
        '--input': 'oklch(0.9551 0 0)',
        '--ring': 'oklch(0.5025 0.1459 253.4388)',
      },
      dark: {
        '--background': 'oklch(0.1448 0 0)',
        '--foreground': 'oklch(0.8945 0 0)',
        '--card': 'oklch(0.1913 0 0)',
        '--card-foreground': 'oklch(0.8945 0 0)',
        '--popover': 'oklch(0.1913 0 0)',
        '--popover-foreground': 'oklch(0.8945 0 0)',
        '--primary': 'oklch(0.6485 0.1381 243.9403)',
        '--primary-foreground': 'oklch(0.1448 0 0)',
        '--secondary': 'oklch(0.2719 0.0234 248.6987)',
        '--secondary-foreground': 'oklch(0.6485 0.1381 243.9403)',
        '--muted': 'oklch(0.2350 0 0)',
        '--muted-foreground': 'oklch(0.6401 0 0)',
        '--accent': 'oklch(0.3121 0.0226 248.5550)',
        '--accent-foreground': 'oklch(0.6485 0.1381 243.9403)',
        '--destructive': 'oklch(0.6763 0.2115 24.8106)',
        '--destructive-foreground': 'oklch(1.0000 0 0)',
        '--border': 'oklch(0.2768 0 0)',
        '--input': 'oklch(0.2134 0 0)',
        '--ring': 'oklch(0.6485 0.1381 243.9403)',
      },
    },
  },
  mint: {
    name: 'mint',
    label: 'Mint',
    cssVariables: {
      light: {
        '--background': 'oklch(0.9911 0 0)',
        '--foreground': 'oklch(0.2046 0 0)',
        '--card': 'oklch(0.9911 0 0)',
        '--card-foreground': 'oklch(0.2046 0 0)',
        '--popover': 'oklch(0.9911 0 0)',
        '--popover-foreground': 'oklch(0.4386 0 0)',
        '--primary': 'oklch(0.8348 0.1302 160.9080)',
        '--primary-foreground': 'oklch(0.2626 0.0147 166.4589)',
        '--secondary': 'oklch(0.9940 0 0)',
        '--secondary-foreground': 'oklch(0.2046 0 0)',
        '--muted': 'oklch(0.9461 0 0)',
        '--muted-foreground': 'oklch(0.2435 0 0)',
        '--accent': 'oklch(0.9461 0 0)',
        '--accent-foreground': 'oklch(0.2435 0 0)',
        '--destructive': 'oklch(0.5523 0.1927 32.7272)',
        '--destructive-foreground': 'oklch(0.9934 0.0032 17.2118)',
        '--border': 'oklch(0.9037 0 0)',
        '--input': 'oklch(0.9731 0 0)',
        '--ring': 'oklch(0.8348 0.1302 160.9080)',
      },
      dark: {
        '--background': 'oklch(0.1822 0 0)',
        '--foreground': 'oklch(0.9288 0.0126 255.5078)',
        '--card': 'oklch(0.2046 0 0)',
        '--card-foreground': 'oklch(0.9288 0.0126 255.5078)',
        '--popover': 'oklch(0.2603 0 0)',
        '--popover-foreground': 'oklch(0.7348 0 0)',
        '--primary': 'oklch(0.4365 0.1044 156.7556)',
        '--primary-foreground': 'oklch(0.9213 0.0135 167.1556)',
        '--secondary': 'oklch(0.2603 0 0)',
        '--secondary-foreground': 'oklch(0.9851 0 0)',
        '--muted': 'oklch(0.2393 0 0)',
        '--muted-foreground': 'oklch(0.7122 0 0)',
        '--accent': 'oklch(0.3132 0 0)',
        '--accent-foreground': 'oklch(0.9851 0 0)',
        '--destructive': 'oklch(0.3123 0.0852 29.7877)',
        '--destructive-foreground': 'oklch(0.9368 0.0045 34.3092)',
        '--border': 'oklch(0.2809 0 0)',
        '--input': 'oklch(0.2603 0 0)',
        '--ring': 'oklch(0.8003 0.1821 151.7110)',
      },
    },
  },
};

export function applyTheme(themeName: ThemeName, mode: 'light' | 'dark' = 'light') {
  const theme = themes[themeName];
  if (!theme) return;

  const variables = mode === 'dark' ? theme.cssVariables.dark : theme.cssVariables.light;
  const root = document.documentElement;

  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export type Radius = '0' | '0.25' | '0.5' | '0.75' | '1.0';

export function applyRadius(radius: string) {
  const root = document.documentElement;
  root.style.setProperty('--radius', `${radius}rem`);
}

export function getCurrentTheme(): ThemeName {
  if (typeof window === 'undefined') return 'mint';
  return (localStorage.getItem('aerotodo_theme') as ThemeName) || 'mint';
}

export function getCurrentRadius(): string {
  if (typeof window === 'undefined') return '0.25';
  return localStorage.getItem('aerotodo_radius') || '0.25';
}

export function saveTheme(themeName: ThemeName) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('aerotodo_theme', themeName);
}

export function saveRadius(radius: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('aerotodo_radius', radius);
}

