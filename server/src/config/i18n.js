import i18n from "i18next";
import Backend from "i18next-fs-backend";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

i18n.use(Backend).init({
  lng: "en",
  fallbackLng: "en",
  backend: {
    loadPath: join(__dirname, "../../locales/{{lng}}/translation.json"),
  },
  interpolation: { escapeValue: false },
});

export default i18n;