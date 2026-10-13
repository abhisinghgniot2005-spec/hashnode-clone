const express = require("express");
const Blog = require("../models/Blog");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      coverImage,
      tags,
      status,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    const blog = await Blog.create({
      title,
      content,
      excerpt,
      coverImage,
      tags,
      status: status || "draft",
      author: req.user.id,
    });

    res.status(201).json({
      message: "Blog created successfully",
      blog,
    });
  } catch (error) {
    res.status(500).json({
      message: "Blog creation failed",
      error: error.message,
    });
  }
});

// Get all published blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published" })
      .populate("author", "name username")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch blogs",
      error: error.message,
    });
  }
});
// Get logged-in user's blogs
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const blogs = await Blog.find({
      author: req.user.id,
    })
      .populate("author", "name username")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch your blogs",
      error: error.message,
    });
  }
});

// Get single blog by ID
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("author", "name username");

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    res.status(200).json({
      blog,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch blog",
      error: error.message,
    });
  }
});

// Update blog
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, content, excerpt, tags, status } = req.body;

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    // Only blog owner can update
    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to update this blog",
      });
    }

    blog.title = title ?? blog.title;
    blog.content = content ?? blog.content;
    blog.excerpt = excerpt ?? blog.excerpt;
    blog.tags = tags ?? blog.tags;
    blog.status = status ?? blog.status;

    await blog.save();

    res.status(200).json({
      message: "Blog updated successfully",
      blog,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update blog",
      error: error.message,
    });
  }
});

// Delete blog
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    // Only blog owner can delete
    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not allowed to delete this blog",
      });
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Blog deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete blog",
      error: error.message,
    });
  }
});

module.exports = router;