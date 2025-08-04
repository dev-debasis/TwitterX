import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";

const likeTweet = async (req, res) => {
  try {
    const tweetId = req.params.tweetId;
    const userId = req.user._id;

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) return res.status(404).json({ message: "Tweet not found" });

    const alreadyLiked = tweet.likedBy.includes(userId);

    if (alreadyLiked) {
      tweet.likedBy.pull(userId);
      tweet.likeCounts = Math.max(0, tweet.likeCounts - 1);
    } else {
      tweet.likedBy.push(userId);
      tweet.likeCounts = (tweet.likeCounts || 0) + 1;
    }

    await tweet.save();

    res.json({
      liked: !alreadyLiked,
      likeCounts: tweet.likeCounts,
      likedBy: tweet.likedBy,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export {
  likeTweet
}