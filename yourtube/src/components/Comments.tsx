import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Languages, ThumbsDown, ThumbsUp } from "lucide-react";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
  city?: string;
  likes?: number;
  dislikes?: number;
}

const Comments = ({ videoId }: { videoId: string | string[] | undefined }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [translatedComments, setTranslatedComments] = useState<Record<string, string>>({});
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (videoId) {
      loadComments();
    }
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
      });
      if (res.data.data) {
        setComments([res.data.data, ...comments]);
      }
      setNewComment("");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error adding comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    try {
      const res = await axiosInstance.post(`/comment/editcomment/${editingCommentId}`, {
        commentbody: editText,
      });
      if (res.data) {
        setComments((prev) =>
          prev.map((c) => (c._id === editingCommentId ? { ...c, commentbody: editText } : c))
        );
        setEditingCommentId(null);
        setEditText("");
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to edit comment");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleReaction = async (id: string, type: "like" | "dislike") => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/comment/react/${id}`, {
        userId: user._id,
        type,
      });

      if (res.data.removed) {
        setComments((prev) => prev.filter((comment) => comment._id !== id));
        return;
      }

      setComments((prev) => prev.map((comment) => (comment._id === id ? res.data : comment)));
    } catch (error) {
      console.log(error);
    }
  };

  const handleTranslate = async (id: string) => {
    const current = comments.find((item) => item._id === id);
    if (!current) return;

    try {
      const response = await axiosInstance.post("/comment/translate", {
        text: current.commentbody,
        targetLanguage,
      });

      setTranslatedComments((prev) => ({
        ...prev,
        [id]: response.data.translatedText,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{comments.length} Comments</h2>
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          <select
            value={targetLanguage}
            onChange={(event) => setTargetLanguage(event.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
            <option value="te">Telugu</option>
            <option value="ml">Malayalam</option>
            <option value="kn">Kannada</option>
          </select>
        </div>
      </div>

      {user && (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment in your preferred language..."
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setNewComment("")} disabled={!newComment.trim()}>
                Cancel
              </Button>
              <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmitting}>
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback>{comment.usercommented?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium text-sm">{comment.usercommented}</span>
                  {comment.city && <span className="text-xs text-gray-500">{comment.city}</span>}
                  <span className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(comment.commentedon))} ago
                  </span>
                </div>

                {editingCommentId === comment._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button onClick={handleUpdateComment} disabled={!editText.trim()}>
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">{comment.commentbody}</p>
                    {translatedComments[comment._id] && (
                      <p className="mt-2 rounded-md bg-muted px-3 py-2 text-sm">
                        {translatedComments[comment._id]}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <button onClick={() => handleReaction(comment._id, "like")} className="inline-flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" /> {comment.likes || 0}
                      </button>
                      <button onClick={() => handleReaction(comment._id, "dislike")} className="inline-flex items-center gap-1">
                        <ThumbsDown className="h-4 w-4" /> {comment.dislikes || 0}
                      </button>
                      <button onClick={() => handleTranslate(comment._id)}>Translate</button>
                      {comment.userid === user?._id && <button onClick={() => handleEdit(comment)}>Edit</button>}
                      {comment.userid === user?._id && <button onClick={() => handleDelete(comment._id)}>Delete</button>}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
