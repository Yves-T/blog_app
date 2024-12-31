import Image from "./Image";
import { toast } from "react-toastify";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/clerk-react";
import { format } from "timeago.js";

export default function Comment({ comment, postId }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const role = user?.publicMetadata?.role;

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return axios.delete(
        `${import.meta.env.VITE_API_URL}/comments/${comment._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      toast.success("Comment deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.response.data);
    },
  });

  return (
    <div className="p-4 bg-stone-50 rounded-xl mb-8">
      <div className="flex items-center gap-4">
        {comment?.user?.img && (
          <Image
            src={comment.user.img}
            className="w-10 h-10 rounded-full object-cover"
            w="40"
          />
        )}
        <span className="font-medium">{comment?.user?.username}</span>
        <span className="text-sm text-gray-500">
          {format(comment.createdAt)}
        </span>

        {user &&
          (user.emailAddresses.some(
            ({ emailAddress }) => emailAddress === comment?.user?.username,
          ) ||
            role === "admin") && (
            <span
              className="text-xs text-red-300 hover:text-red-500 cursor-pointer"
              onClick={() => mutation.mutate()}
            >
              delete
              {mutation.isPending && <span>(in progress)</span>}
            </span>
          )}
      </div>
      <div className="mt-4">
        <p>{comment.desc}</p>
      </div>
    </div>
  );
}