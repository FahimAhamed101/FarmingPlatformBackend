const mongoose = require("mongoose");

const communityPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  postContent: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 3000,
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  postDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CommunityPost", communityPostSchema);
