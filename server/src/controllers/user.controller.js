import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { createToken } from "../utils/jwt.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    if (![name, email, username, password].every((field) => field?.trim())) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    const isEmailExist = await User.findOne({ email: email.toLowerCase() });
    const isUsernameExist = await User.findOne({
      username: username.toLowerCase(),
    });

    if (isEmailExist) {
      return res.status(409).json({
        message: "User with this email already exist",
      });
    }
    if (isUsernameExist) {
      return res.status(409).json({
        message: "User with this username already exist",
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
    });

    const createdUser = await User.findById(user._id).select("-password");
    if (!createdUser) {
      return res.status(500).json({
        message: "Something went wrong while registering the user.",
      });
    }

    return res.status(201).json({
      message: "User registered successfully",
      user: createdUser,
      token: createToken(createdUser),
    });
  } catch (error) {
    console.error("Server error during user reg.: ", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email && !username) {
      return res.status(400).json({
        message: "Either email or username is required.",
      });
    }

    if (!password?.trim()) {
      return res.status(400).json({
        message: "Password is required.",
      });
    }

    const user = await User.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { username: username?.toLowerCase },
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "No user found with this email/username.",
      });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid Password.",
      });
    }

    const loggedUser = await User.findById(user._id).select("-password");

    return res.status(200).json({
      message: "User logged in successfully.",
      user: loggedUser,
      token: createToken(loggedUser),
    });
  } catch (error) {
    console.log("Server Error during user login: ", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

const profile = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized access",
      });
    }
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "No user found.",
      });
    }

    return res.status(200).json({
      message: "Profile fetched successfully.",
      user,
    });
  } catch (error) {
    console.error("Server error while fetching the profile: ", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, username, bio } = req.body;
    if (![name, email, username, bio].every((field) => field?.trim())) {
      return res.status(400).json({
        message: "Empty fields are not allowed.",
      });
    }

    const existingEmailUser = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: req.user._id },
    });
    const existingUsernameUser = await User.findOne({
      username: username.toLowerCase(),
      _id: { $ne: req.user._id },
    });

    if (existingEmailUser) {
      return res.status(409).json({
        message: "Email already in use by another user.",
      });
    }
    if (existingUsernameUser) {
      return res.status(409).json({
        message: "username already in use by another user.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          name,
          email,
          username,
          bio,
        },
      },
      {
        new: true,
      }
    ).select("-password");

    return res.status(200).json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Server error during the profile update.");
    return res.status(500).json({
      message: error.message,
    });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
      return res.status(400).json({
        message: "Avatar file is missing",
      });
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
      return res.status(400).json({
        message: "Error while uploading the avatar",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: { avatar: avatar.url },
      },
      {
        new: true,
      }
    ).select("-password");

    return res.status(200).json({
      message: "Avatar updated successfully",
      user,
    });
  } catch (error) {
    console.error("Server error during the avatar update.");
    return res.status(500).json({
      message: error.message,
    });
  }
};

const updateCoverImage = async (req, res) => {
  try {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
      return res.status(400).json({
        message: "CoverImage file is missing",
      });
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
      return res.status(400).json({
        message: "Error while uploading the CoverImage",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: { coverImage: coverImage.url },
      },
      {
        new: true,
      }
    ).select("-password");
    return res.status(200).json({
      message: "Cover Image updated successfully.",
      user,
    });
  } catch (error) {
    console.log("Server error during cover image update");
    return res.status(500).json({
      message: error.message,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (
      ![oldPassword, newPassword, confirmPassword].every((field) =>
        field?.trim()
      )
    ) {
      return res.status(400).json({
        message: "Fields can't be empty.",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Your new password and confirm are not same",
      });
    }
    if (oldPassword === newPassword) {
      return res.status(400).json({
        message: "Old Password and new password can't be same.",
      });
    }
    const user = await User.findById(req.user._id);
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid Old password",
      });
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Password Updated Successfully",
    });
  } catch (error) {
    console.error("Server error during password change");
    return res.status(500).json({
      message: error.message,
    });
  }
};

const searchUser = async (req, res) => {
  try {
    const { searchQuery } = req.query;

    if (!searchQuery || searchQuery.trim().length === 0) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const searchRegex = new RegExp(searchQuery.trim(), "i");

    const users = await User.find({
      $or: [
        { name: { $regex: searchRegex } },
        { username: { $regex: searchRegex } },
      ],
    })
      .select("name username avatar")
      .limit(10);

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Error searching users" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const tweets = await Tweet.find({ userId: user._id })
      .populate("userId", "name username avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        coverImage: user.coverImage,
        bio: user.bio,
        location: user.location,
        website: user.website,
        createdAt: user.createdAt,
        followersCount: user.followersCount || 0,
        followingsCount: user.followingsCount || 0,
      },
      tweets,
      isOwnProfile: false,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      message: "Error fetching user profile",
    });
  }
};

const getNotification = async (req, res) => {
  try {
    const { notificationsEnabled } = req.body;
    if (typeof notificationsEnabled !== "boolean") {
      return res.status(400).json({
        message: "notificationsEnabled must be boolean",
      });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationsEnabled },
      { new: true }
    ).select("notificationsEnabled");
    return res.status(200).json({
      notificationsEnabled: user.notificationsEnabled || true,
    });
  } catch (err) {
    console.error("Server error in the notification: ", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

const updatePhoneNumber = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({
      message: "Phone number is required.",
    });
  }
  if (!req.user || !req.user._id) {
    return res.status(401).json({ 
      message: "Unauthorized access." 
    });
  }
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      message: "User not found.",
    });
  }
  user.phoneNumber = phoneNumber;
  user.phoneVerified = false;
  await user.save();
  return res.status(200).json({
    message: "Phone number updated.",
  });
};

export {
  registerUser,
  loginUser,
  profile,
  updateProfile,
  updateAvatar,
  updateCoverImage,
  changePassword,
  searchUser,
  getUserProfile,
  getNotification,
  updatePhoneNumber,
};
