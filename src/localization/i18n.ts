import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  fallbackLng: "en",
  resources: {
    en: {
      translation: {
        appName: "CanvasOS",
        titleHomePage: "Workspace",
        titleSecondPage: "Overview",
        documentation: "PRD",
        madeBy: "Agent-native desktop shell",
      },
    },
    "pt-BR": {
      translation: {
        appName: "CanvasOS",
        titleHomePage: "Workspace",
        titleSecondPage: "Visão geral",
        documentation: "PRD",
        madeBy: "Shell desktop agent-native",
      },
    },
  },
});
