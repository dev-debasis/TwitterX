import axios from 'axios';
import { User } from "../models/user.model.js"
import { createToken } from '../utils/jwt.js';
import { oauth2client } from "../utils/googleConfig.js"
import crypto from "crypto";


const googleAuth = async (req, res) => {
    try {

        const { code } = req.body;
        const googleRes = await oauth2client.getToken(code);
        oauth2client.setCredentials(googleRes.tokens);

        const userRes = await axios.get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
        )

        const { email, name, picture, id } = userRes.data;
        
        let user = await User.findOne({ email });

        if(!user){
            const randomPassword = crypto.randomBytes(32).toString('hex');
            user = await User.create({
                name,
                email,
                username: `${email.split('@')[0]}_${id.slice(0, 4)}`.toLowerCase(),
                password: randomPassword,
                avatar: picture,
                googleId: id,
            });
        }

        const token = createToken(user);

        return res.status(200).json({
            user,
            token
        });

    } catch (error) {
        console.error("Google OAuth Error: ", error.response?.data || error.message);
        return res.status(500).json({ 
            message: "Google authentication failed." 
        });
    }
};

export { googleAuth }
