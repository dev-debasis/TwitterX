import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = await req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization is missing",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token must be a Bearer token",
      });
    }

    const token = await authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Token not provided",
      });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return res.status(401).json({
        message: "Token is either invalid or expired",
      });
    }

    const user = await User.findById(decodedToken.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid access token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(
      "Something went wrong in the server side auth middleware: ",
      error
    );
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please log in again",
      });
    }
    return res.status(401).json({
      message: "Invalid Token",
    });
  }
};

export { verifyJWT };
