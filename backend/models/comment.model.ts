import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", requirred: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", requirred: true },
    desc: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Comment", commentSchema);
