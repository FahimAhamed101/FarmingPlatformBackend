const { StatusCodes } = require("http-status-codes");

const CommunityPost = require("../models/CommunityPost");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

const createPost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.create({
    userId: req.user._id,
    postContent: req.body.postContent,
    tags: req.body.tags || [],
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: "Community post created successfully.",
    data: post,
  });
});

const listPosts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { q, tag } = req.query;

  const filter = {};

  if (q) {
    filter.postContent = { $regex: q, $options: "i" };
  }

  if (tag) {
    filter.tags = tag;
  }

  const [posts, total] = await Promise.all([
    CommunityPost.find(filter)
      .populate("userId", "name role")
      .sort({ postDate: -1 })
      .skip(skip)
      .limit(limit),
    CommunityPost.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: "Community posts fetched successfully.",
    data: posts,
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

const updatePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.postId);

  if (!post) {
    const error = new Error("Community post not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "POST_NOT_FOUND";
    throw error;
  }

  const isOwner = post.userId.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    const error = new Error("You can only edit your own post.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "FORBIDDEN";
    throw error;
  }

  if (req.body.postContent !== undefined) {
    post.postContent = req.body.postContent;
  }

  if (req.body.tags !== undefined) {
    post.tags = req.body.tags;
  }

  await post.save();

  return sendSuccess(res, {
    message: "Community post updated successfully.",
    data: post,
  });
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await CommunityPost.findById(req.params.postId);

  if (!post) {
    const error = new Error("Community post not found.");
    error.statusCode = StatusCodes.NOT_FOUND;
    error.code = "POST_NOT_FOUND";
    throw error;
  }

  const isOwner = post.userId.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    const error = new Error("You can only delete your own post.");
    error.statusCode = StatusCodes.FORBIDDEN;
    error.code = "FORBIDDEN";
    throw error;
  }

  await post.deleteOne();

  return sendSuccess(res, {
    message: "Community post deleted successfully.",
    data: { id: req.params.postId },
  });
});

module.exports = {
  createPost,
  listPosts,
  updatePost,
  deletePost,
};
