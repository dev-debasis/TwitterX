import { Follow } from "../models/follow.model.js";
import { User } from "../models/user.model.js";

const toggleFollow = async (req, res) => {
  try {
    const { id: targetUserId } = req.params;
    const loggedInUserId = req.user._id;

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) return res.status(404).json({ 
      message: "Targeted user not found." 
    });

    if (loggedInUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({ message: "You can't follow yourself." });
    }

    const existingFollow = await Follow.findOne({
      followerId: loggedInUserId,
      followingId: targetUserId,
    });

    if (existingFollow) {
      await Follow.deleteOne({ _id: existingFollow._id });
      await User.findByIdAndUpdate(loggedInUserId, { $inc: { followingsCount: -1 } });
      await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } });

      return res.status(200).json({ 
        message: "Unfollowed user successfully." 
    });
    } else {
      await Follow.create({
        followerId: loggedInUserId,
        followingId: targetUserId,
      });
      await User.findByIdAndUpdate(loggedInUserId, { $inc: { followingsCount: 1 } });
      await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } });

      return res.status(200).json({ 
        message: "Followed user successfully."
    });
    }
  } catch (error) {
    console.error("Error in toggleFollow:", error);
    return res.status(500).json({ 
        message: error.message 
    });
  }
};

export { 
  toggleFollow
}
