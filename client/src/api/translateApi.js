import axios from "axios";

export async function getTranslation(text, to, from = "en") {
  const res = await axios.get("http://localhost:8000/api/v1/language/translate", {
    params: { text, to, from }
  });
  return res.data.translation;
}