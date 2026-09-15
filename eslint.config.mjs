import nextConfig from "eslint-config-next";

const config = [...nextConfig];

config.push({
  rules: {
    "react-hooks/set-state-in-effect": "off",
    "react-hooks/purity": "off",
    "react-hooks/immutability": "off",
    "react-hooks/incompatible-library": "off",
  },
});

export default config;
