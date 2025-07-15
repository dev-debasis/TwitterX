import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleLike = async (req, res) => {
  try {
    const { id: tweetId } = req.params;
    const userId = req.user._id;

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
      return res.status(404).json({
        message: "No tweet found."
      })
    }

    const existingLike = await Like.findOne({ userId, tweetId });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      await Tweet.findByIdAndUpdate(tweetId, { $inc: { likeCounts: -1 } });

      return res.status(200).json({ 
        message: "Tweet unliked successfully." 
    });
    } else {
      await Like.create({ userId, tweetId });
      await Tweet.findByIdAndUpdate(tweetId, { $inc: { likeCounts: 1 } });

      return res.status(200).json({ 
        message: "Tweet liked successfully." 
    });
    }
  } catch (error) {
    console.error("Error in toggleLike:", error);
    return res.status(500).json({ 
        message: error.message 
    });
  }
};

export {
  toggleLike
}