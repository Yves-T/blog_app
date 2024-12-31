import { Request, Response } from "express";
import ImageKit from "imagekit";
import Post from "@models/post.model";
import User from "@models/user.model";
import { AuthRequest } from "@interface/auth.interface";
import { PostRequest } from "@interface/post.interface";

export const getPosts = async (
  req: Request<{}, {}, {}, PostRequest>,
  res: Response,
) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;

  let query = {};
  const cat = req.query.cat;
  const author = req.query.author;
  const searchQuery = req.query.search;
  const sortQuery = req.query.sort;
  const featured = req.query.featured;

  if (cat) {
    query = Object.assign(query, { category: cat });
  }

  if (searchQuery) {
    query = Object.assign(query, {
      title: { $regex: searchQuery, $options: "i" },
    });
  }

  if (author) {
    const user = await User.findOne({ username: author }).select("_id");

    if (!user) {
      return res.status(404).json("No post found!");
    }

    query = Object.assign(query, { user: user._id });
  }
  let sortObj = {};
  if (sortQuery) {
    switch (sortQuery) {
      case "newest":
        sortObj = { createdAt: -1 };
        break;
      case "oldest":
        sortObj = { createdAt: 1 };
        break;
      case "popular":
        sortObj = { visit: -1 };
        break;
      case "trending":
        sortObj = { visit: -1 };
        query = Object.assign(query, {
          createdAt: {
            $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        });
        break;
    }
  }
  if (featured) {
    query = Object.assign(query, { isFeatured: true });
  }

  const posts = await Post.find(query)
    .populate("user", "username")
    .sort(sortObj)
    .limit(limit)
    .skip((page - 1) * limit);

  const totalPosts = await Post.countDocuments();
  const hasMore = page * limit < totalPosts;

  res.status(200).json({ posts, hasMore });
};

export const getPost = async (req: Request, res: Response) => {
  const post = await Post.findOne({ slug: req.params.slug }).populate(
    "user",
    "username img",
  );
  res.status(200).json(post);
};

export const createPost = async (req: AuthRequest, res: Response) => {
  const clerkUserId = req.auth?.userId;

  if (!clerkUserId) {
    return res.status(401).json("Not authenticated");
  }

  const user = await User.findOne({ clerkUserId });
  if (!user) {
    return res.status(404).json("User not found!");
  }

  let slug = req.body.title.replace(/ /g, "-").toLowerCase();
  let existingPost = await Post.findOne({ slug });
  let counter = 2;
  while (existingPost) {
    slug = `${slug}-${counter}`;
    existingPost = await Post.findOne({ slug });
    counter++;
  }
  const newPost = new Post({ user: user.id, slug, ...req.body });
  const post = await newPost.save();
  res.status(200).json(post);
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  const clerkUserId = req.auth?.userId;
  if (!clerkUserId) {
    return res.status(401).json("Not authenticated");
  }

  const role = req.auth?.sessionClaims?.metadata?.role;
  if (role === "admin") {
    await Post.findByIdAndDelete(req.params.id);
    return res.status(200).json("Post has been deleted!");
  }

  const user = await User.findOne({ clerkUserId });

  const deletedPost = await Post.findByIdAndDelete({
    _id: req.params.id,
    user: user!._id,
  });

  if (!deletePost) {
    return res.status(403).json("You can only delete your posts");
  }
  res.status(200).json("post has been deleted!");
};

const imagekit = new ImageKit({
  urlEndpoint: process.env.IK_URL_ENDPOINT!,
  publicKey: process.env.IK_PUBLIC_KEY!,
  privateKey: process.env.IK_PRIVATE_KEY!,
});

export const uploadAuth = async (req: Request, res: Response) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
};

export const featurePost = async (req: AuthRequest, res: Response) => {
  const clerkUserId = req.auth?.userId;
  const postId = req.body.postId;

  if (!clerkUserId) {
    return res.status(401).json("Not authenticated");
  }

  const role = req.auth?.sessionClaims?.metadata?.role;
  if (role !== "admin") {
    return res.status(403).json("You cannot featuer posts!");
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json("Post not found");
  }

  const isFeatured = post.isFeatured;

  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    {
      isFeatured: !isFeatured,
    },
    { new: true },
  );

  res.status(200).json(updatedPost);
};