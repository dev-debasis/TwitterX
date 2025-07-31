import axios from "axios";

const LIBRE_TRANSLATE_URL = "https://libretranslate.com/translate";

export async function translateText(text, targetLang, sourceLang = "auto") {
  const res = await axios.post(LIBRE_TRANSLATE_URL, {
    q: text,
    source: sourceLang,
    target: targetLang,
    format: "text"
  }, {
    headers: { "accept": "application/json" }
  });
  console.log("Res of translate API call: ",res)
  return res.data.translatedText;
}