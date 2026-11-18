export interface AxiomTheme {
    id: string;
    name: string;
    primary: string;
    secondary: string;
    glowColor: string;
    badgeBg: string;
    textHighlight: string;
    gradient: string;
  }
  
  export const AXIOM_THEMES: Record<string, AxiomTheme> = {
    'neon-cyan': {
      id: 'neon-cyan',
      name: 'Cyber Cyan & Emerald',
      primary: '#00f2fe',
      secondary: '#10b981',
      glowColor: 'rgba(0, 242, 254, 0.25)',
      badgeBg: 'rgba(0, 242, 254, 0.1)',
      textHighlight: '#00ffcc',
      gradient: 'from-[#00f2fe] to-[#10b981]',
    },
    'solar-amber': {
      id: 'solar-amber',
      name: 'Solar Amber & Bronze',
      primary: '#ffb020',
      secondary: '#f97316',
      glowColor: 'rgba(255, 176, 32, 0.25)',
      badgeBg: 'rgba(255, 176, 32, 0.1)',
      textHighlight: '#ffdda1',
      gradient: 'from-[#ffb020] to-[#f97316]',
    },
    'electric-violet': {
      id: 'electric-violet',
      name: 'Electric Violet & Magenta',
      primary: '#a855f7',
      secondary: '#ec4899',
      glowColor: 'rgba(168, 85, 247, 0.25)',
      badgeBg: 'rgba(168, 85, 247, 0.1)',
      textHighlight: '#e879f9',
      gradient: 'from-[#a855f7] to-[#ec4899]',
    },
    'alpine-emerald': {
      id: 'alpine-emerald',
      name: 'Alpine Forest & Steel',
      primary: '#10b981',
      secondary: '#06b6d4',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      badgeBg: 'rgba(16, 185, 129, 0.1)',
      textHighlight: '#34d399',
      gradient: 'from-[#10b981] to-[#06b6d4]',
    },
    'obsidian-crimson': {
      id: 'obsidian-crimson',
      name: 'Obsidian & Racing Crimson',
      primary: '#ef4444',
      secondary: '#f59e0b',
      glowColor: 'rgba(239, 68, 68, 0.25)',
      badgeBg: 'rgba(239, 68, 68, 0.1)',
      textHighlight: '#f87171',
      gradient: 'from-[#ef4444] to-[#f59e0b]',
    },
    'cinematic-rose': {
      id: 'cinematic-rose',
      name: 'Cinematic Studio Rose & Gold',
      primary: '#f43f5e',
      secondary: '#fb7185',
      glowColor: 'rgba(244, 63, 94, 0.20)',
      badgeBg: 'rgba(244, 63, 94, 0.1)',
      textHighlight: '#fda4af',
      gradient: 'from-[#f43f5e] to-[#fb923c]',
    },
  };