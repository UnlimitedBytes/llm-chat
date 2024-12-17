export class ThemeManager {
    constructor() {
        this.THEME_KEY = 'preferred_theme';
        this.loadPreferredTheme();
        this.setupSystemThemeListener();
    }

    loadPreferredTheme() {
        const stored = localStorage.getItem(this.THEME_KEY);
        if (stored) {
            if (stored === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
            this.setSystemPreferredTheme();
        }
    }

    setSystemPreferredTheme() {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    setupSystemThemeListener() {
        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', e => {
                if (!localStorage.getItem(this.THEME_KEY)) {
                    if (e.matches) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
            });
    }

    toggle() {
        const isDark = document.documentElement.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        localStorage.setItem(this.THEME_KEY, newTheme);
    }
}
