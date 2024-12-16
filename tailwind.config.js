const forms = require("@tailwindcss/forms");
const typography = require("@tailwindcss/typography");

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: ["./index.html", "./js/**/*.js"],
    theme: {
        extend: {
            colors: {
                discord: {
                    50: "#f6f6f7",
                    100: "#e3e5e8",
                    200: "#dcddde",
                    300: "#b9bbbe",
                    400: "#4f545c",
                    500: "#383a40",
                    600: "#313338",
                    700: "#2b2d31",
                    800: "#1e1f22",
                    900: "#202225",
                },
                accent: {
                    primary: "#5865f2",
                    hover: "#4752c4",
                },
                llm: {
                    light: "#008f6c",
                    dark: "#00a67d",
                }
            },
            typography: {
                DEFAULT: {
                    css: {
                        maxWidth: 'none',
                        color: 'inherit',
                        a: {
                            color: '#3b82f6',
                            '&:hover': {
                                color: '#2563eb',
                            },
                        },
                        h1: {
                            color: 'inherit',
                        },
                        h2: {
                            color: 'inherit',
                        },
                        h3: {
                            color: 'inherit',
                        },
                        strong: {
                            color: 'inherit',
                        },
                        code: {
                            color: 'inherit',
                            backgroundColor: 'rgb(var(--tw-prose-pre-bg))',
                            padding: '0.2em 0.4em',
                            borderRadius: '3px',
                        },
                        pre: {
                            backgroundColor: '#282c34',
                            color: '#abb2bf',
                        }
                    }
                }
            }
        }
    },
    plugins: [forms, typography],
};
