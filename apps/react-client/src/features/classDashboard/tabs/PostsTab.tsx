"use client";

import { useState, useEffect } from "react";
import { postRepository } from "@/services/PostRepository";
import { useToast } from "@/components/Toast";

interface PostsTabProps {
  classId: string;
}

/**
 * PostsTab - Posts/announcements view for the class.
 */
export default function PostsTab({ classId }: PostsTabProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Initialize posts on mount
  useEffect(() => {
    const initPosts = async () => {
      try {
        await postRepository.initialize(classId);
        setPosts(postRepository.getPosts());
        setIsLoading(false);
      } catch (error) {
        console.error("❌ Failed to load posts:", error);
        setIsLoading(false);
      }
    };
    initPosts();
  }, [classId]);

  const handlePost = () => {
    if (!content.trim()) {
      showToast("Post content cannot be empty", "warning", 2000);
      return;
    }

    try {
      postRepository.createPost(classId, content, "Teacher", "teacher");
      setPosts(postRepository.getPosts());
      setContent("");
      showToast("✅ Post created successfully!", "success", 2000);
    } catch (error) {
      console.error("❌ Failed to create post:", error);
      showToast("❌ Failed to create post", "error", 2000);
    }
  };

  const handleDelete = (postId: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        postRepository.deletePost(classId, postId);
        setPosts(postRepository.getPosts());
        showToast("✅ Post deleted", "success", 2000);
      } catch (error) {
        console.error("❌ Failed to delete post:", error);
        showToast("❌ Failed to delete post", "error", 2000);
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500">Loading posts...</div>;
  }

  return (
    <div className="max-w-4xl p-6 mx-auto">
      <div className="p-6 bg-white border rounded-lg border-slate-200">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Class Posts</h2>

        {/* Create Post */}
        <div className="mb-6">
          <textarea
            className="w-full p-3 text-sm border rounded-lg resize-none border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Share an announcement with your class..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handlePost}
              className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Post
            </button>
          </div>
        </div>

        {/* Posts List */}
        <div className="pt-4 space-y-4 border-t border-slate-200">
          {posts.length === 0 ? (
            <div className="py-8 text-sm text-center text-slate-500">
              No posts yet. Be the first to share an announcement!
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-b-0">
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 font-semibold text-blue-600 bg-blue-100 rounded-full">
                  {post.author.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900">{post.author}</h4>
                    <span className="text-xs text-slate-500">{formatTime(post.createdAt)}</span>
                  </div>
                  <p className="text-sm break-words whitespace-pre-wrap text-slate-700">{post.content}</p>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="mt-2 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
