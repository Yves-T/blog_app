import { AuthRequest } from "@interface/auth.interface";
import Comment from "@models/comment.model";
import User from "@models/user.model";
import { Request, Response } from "express";

export const getPostComments = async (req: Request, res: Response) => {
  const comments = await Comment.find({ post: req.params.postId })
    .populate("user", "username img")
    .sort({ createdAt: -1 });
  res.json(comments);
};

export const addComment = async (req: AuthRequest, res: Response) => {
  const clerkUserId = req.auth?.userId;
  const postId = req.params.postId;

  if (!clerkUserId) {
    return res.status(401).json("Not authenticated");
  }

  const user = await User.findOne({ clerkUserId });
  const newComment = new Comment({
    ...req.body,
    user: user?._id,
    post: postId,
  });
  const savedComment = await newComment.save();
  res.status(201).json(savedComment);
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  const clerkUserId = req.auth?.userId;
  const id = req.params.id;

  if (!clerkUserId) {
    return res.status(401).json("Not authenticated");
  }

  const role = req.auth?.sessionClaims?.metadata?.role;
  if (role === "admin") {
    await Comment.findByIdAndDelete(req.params.id);
    return res.status(200).json("Comment has been deleted!");
  }

  const user = await User.findOne({ clerkUserId });
  const deleteComment = await Comment.findByIdAndDelete({
    _id: id,
    user: user?._id,
  });

  if (!deleteComment) {
    return res.status(403).json("You can only delete your comment!");
  }

  return res.status(200).json("Comment deleted");
};
