const express = require("express");
const { body } = require("express-validator");

const { createPost, listPosts, updatePost, deletePost } = require("../controllers/community.controller");
const { protect, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * /api/community-posts:
 *   get:
 *     summary: List community forum posts
 *     tags: [Community]
 */
router.get("/community-posts", listPosts);

router.post(
  "/community-posts",
  protect,
  authorize("customer", "vendor", "admin"),
  [body("postContent").isString().trim().isLength({ min: 3 }), body("tags").optional().isArray()],
  validate,
  createPost
);

router.patch(
  "/community-posts/:postId",
  protect,
  authorize("customer", "vendor", "admin"),
  [body("postContent").optional().isString().trim().isLength({ min: 3 }), body("tags").optional().isArray()],
  validate,
  updatePost
);

router.delete("/community-posts/:postId", protect, authorize("customer", "vendor", "admin"), deletePost);

module.exports = router;
