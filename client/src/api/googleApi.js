import axios from 'axios';

const api = axios.create({
    baseURL: "https://twitterx-b7xc.onrender.com/api/v1/auth"
});

export const googleAuth = (code) => api.post("/google", { code });