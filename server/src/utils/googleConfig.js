import { OAuth2Client } from "google-auth-library";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export const oauth2client = new OAuth2Client(
  CLIENT_ID, 
  CLIENT_SECRET, 
  "postmessage"
);
