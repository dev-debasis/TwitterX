import { Tweet } from "../models/tweet.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createTweet = async (req, res) => {
  try {
    const { content } = req.body;
    let imageUrl = "";

    if (req.file) {
      const uploadResult = await uploadOnCloudinary(req.file.path);
      if (uploadResult && uploadResult.url) {
        imageUrl = uploadResult.url;
      }
    }

    if (!content?.trim() && !imageUrl) {
      return res.status(400).json({
        message: "Tweet content or image is required.",
      });
    }

    const tweet = await Tweet.create({
      userId: req.user._id,
      content,
      image: imageUrl,
    });

    return res.status(201).json({
      message: "Tweet created successfully",
      tweet,
    });
  } catch (error) {
    console.error("Error creating tweet:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getAllTweets = async (req, res) => {
  try {
    const tweets = await Tweet.find()
      .populate("userId", "name username avatar")
      .sort({ createdAt: -1 });
    res.json({ tweets });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const getUserTweets = async (req, res) => {
  try {
    const { userId } = req.params;

    const tweets = await Tweet.find({ userId })
      .populate("userId", "name username avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "User tweets fetched",
      tweets,
    });
  } catch (error) {
    console.error("Error fetching user tweets:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

const deleteTweet = async (req, res) => {
  try {
    const { id } = req.params;

    const tweet = await Tweet.findById(id);
    if (!tweet) {
      return res.status(404).json({
        message: "Tweet not found",
      });
    }

    if (tweet.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to delete this tweet",
      });
    }

    await Tweet.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Tweet deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tweet:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export {
    createTweet,
    getAllTweets,
    getUserTweets,
    deleteTweet
}