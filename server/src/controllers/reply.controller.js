import { Reply } from "../models/reply.model.js";
import { Tweet } from "../models/tweet.model.js";

const addReply = async (req, res) => {
  try {
    const { id: tweetId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ 
        message: "Reply content is required." 
    });
    }

    const reply = await Reply.create({
      tweetId,
      userId: req.user._id,
      content,
    });

    await Tweet.findByIdAndUpdate(tweetId, { $inc: { repliesCount: 1 } });

    return res.status(201).json({ 
        message: "Reply posted.", 
        reply 
    });
  } catch (error) {
    console.error("Error in addReply:", error);
    return res.status(500).json({ 
        message: error.message 
    });
  }
};

const getReplies = async (req, res) => {
  try {
    const { id: tweetId } = req.params;

    const replies = await Reply.find({ tweetId })
      .populate("userId", "name username avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({ 
        message: "Replies fetched.", 
        replies 
    });
  } catch (error) {
    console.error("Error in getReplies:", error);
    return res.status(500).json({ 
        message: error.message 
    });
  }
};


export {
  addReply,
  getReplies
}