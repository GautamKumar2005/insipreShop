"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/date";

interface ReviewMedia {
  url: string;
  type: "image" | "video";
}

interface Review {
  _id: string;
  user: { name: string; profilePhoto?: { url: string } };
  rating: number;
  comment?: string;
  media: ReviewMedia[];
  createdAt: string;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [rating, setRating] = useState(4.5);
  const [comment, setComment] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/reviews`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Convert files to base64
      const mediaData: string[] = [];
      for (const file of mediaFiles) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise((resolve) => (reader.onload = resolve));
        mediaData.push(reader.result as string);
      }

      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ rating, comment, mediaData }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Failed to submit review");
      } else {
        // Success
        setReviews([data.data, ...reviews]);
        setComment("");
        setRating(4.5);
        setMediaFiles([]);
      }
    } catch (err: any) {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (val: number) => {
    return (
      <div className="flex text-yellow-400 text-lg">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {val >= star ? "★" : val >= star - 0.5 ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-16 border-t pt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Product Feedback & Reviews ({reviews.length})
      </h2>

      {/* Review Form - Only if buyer */}
      {user?.role === "buyer" && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 border rounded-2xl p-6 mb-10 shadow-sm"
        >
          <h3 className="text-lg font-bold mb-4">Write a Review</h3>
          {error && (
            <p className="text-red-500 text-sm mb-3 font-semibold">{error}</p>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="p-2 border rounded-xl w-32 bg-white"
            >
              <option value={5}>5 Stars</option>
              <option value={4.5}>4.5 Stars</option>
              <option value={4}>4 Stars</option>
              <option value={3}>3 Stars</option>
              <option value={2}>2 Stars</option>
              <option value={1}>1 Star</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Comment</label>
            <textarea
              className="w-full border rounded-xl p-3 h-24 bg-white"
              placeholder="How was the product?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              Upload Photos / Videos (Optional)
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-purple-50 file:text-purple-700
                hover:file:bg-purple-100 cursor-pointer"
            />
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      )}

      {/* Display Reviews */}
      {loading ? (
        <p className="text-gray-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 italic">
          No reviews yet. Be the first to add one!
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => (
            <div key={r._id} className="border-b pb-6">
              <div className="flex items-center gap-3 mb-2">
                {r.user?.profilePhoto?.url ? (
                  <img
                    src={r.user.profilePhoto.url}
                    alt={r.user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {r.user?.name?.charAt(0) || "U"}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900">
                    {r.user?.name || "Unknown User"}
                  </h4>
                  <div className="flex items-center gap-2">
                    {renderStars(r.rating)}
                    <span className="text-xs text-gray-500">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {r.comment && <p className="text-gray-700 mt-3">{r.comment}</p>}

              {r.media && r.media.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {r.media.map((img, i) =>
                    img.type === "video" ? (
                      <video
                        key={i}
                        src={img.url}
                        controls
                        className="w-32 h-32 object-cover rounded-xl border bg-black"
                      />
                    ) : (
                      <img
                        key={i}
                        src={img.url}
                        alt="review"
                        className="w-32 h-32 object-cover rounded-xl border border-gray-200"
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
