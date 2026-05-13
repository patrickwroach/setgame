'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDataByUid } from '../../lib/users';
import {
  Comment,
  REACTION_EMOJIS,
  subscribeToComments,
  addComment,
  deleteComment,
  addReaction,
  removeReaction,
} from '../../lib/comments';
import { searchGiphy, GiphyGif } from '../../lib/giphy';
import { Card, CardTitle } from '../ui/Card';
import { Timestamp } from 'firebase/firestore';

interface CommentsSectionProps {
  date: string;
}

function formatTimestamp(ts: Timestamp | null): string {
  if (!ts) return '';
  const d = ts.toDate();
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

interface CommentRowProps {
  comment: Comment;
  isReply?: boolean;
  currentUserId: string | undefined;
  replyTo: string | null;
  replyText: string;
  setReplyTo: (id: string | null) => void;
  setReplyText: (text: string) => void;
  submitting: boolean;
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
  onSubmit: (parentId: string | null) => void;
  onDelete: (commentId: string) => void;
  onReaction: (commentId: string, emoji: string, hasReacted: boolean) => void;
  replies: Comment[];
  repliesMap: Record<string, Comment[]>;
  replyInputRef: React.RefObject<HTMLTextAreaElement | null>;
}

function CommentRow({
  comment,
  isReply = false,
  currentUserId,
  replyTo,
  replyText,
  setReplyTo,
  setReplyText,
  submitting,
  confirmDelete,
  setConfirmDelete,
  onSubmit,
  onDelete,
  onReaction,
  replies,
  repliesMap,
  replyInputRef,
}: CommentRowProps) {
  const isOwn = currentUserId === comment.userId;

  return (
    <div className={`${isReply ? 'ml-8 border-l-2 border-border pl-4' : ''} py-3`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-foreground text-sm truncate">
              {comment.displayName}
            </span>
            <span className="text-muted-foreground text-xs shrink-0">
              {formatTimestamp(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1 text-foreground text-sm whitespace-pre-wrap break-words">
            {comment.text}
          </p>
          {comment.gifUrl && (
            <img
              src={comment.gifUrl}
              alt="GIF"
              className="mt-2 rounded-lg max-w-[200px] max-h-[150px]"
            />
          )}
        </div>
      </div>

      {/* Reactions */}
      <div className="flex flex-wrap items-center gap-1 mt-2">
        {REACTION_EMOJIS.map((emoji) => {
          const reactors = comment.reactions?.[emoji] || [];
          const hasReacted = currentUserId ? reactors.includes(currentUserId) : false;
          const count = reactors.length;
          return (
            <button
              key={emoji}
              onClick={() => onReaction(comment.id, emoji, hasReacted)}
              disabled={!currentUserId}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                hasReacted
                  ? 'bg-primary/20 border border-primary/40'
                  : 'bg-secondary hover:bg-secondary/80 border border-transparent'
              } ${count === 0 && !hasReacted ? 'opacity-50 hover:opacity-100' : ''}`}
            >
              <span>{emoji}</span>
              {count > 0 && <span className="text-foreground">{count}</span>}
            </button>
          );
        })}

        {/* Reply button */}
        {!isReply && (
          <button
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            className="ml-2 text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            Reply
          </button>
        )}

        {/* Delete button (own comments only) */}
        {isOwn && (
          <>
            {confirmDelete === comment.id ? (
              <span className="ml-2 text-xs">
                <button
                  onClick={() => onDelete(comment.id)}
                  className="mr-1 text-red-500 hover:text-red-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmDelete(comment.id)}
                className="ml-2 text-muted-foreground hover:text-red-500 text-xs transition-colors"
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>

      {/* Inline reply input */}
      {replyTo === comment.id && (
        <div className="flex gap-2 mt-3 ml-4">
          <textarea
            ref={replyInputRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            maxLength={500}
            rows={2}
            className="flex-1 bg-secondary p-2 border border-border rounded-lg text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(comment.id);
              }
            }}
          />
          <button
            onClick={() => onSubmit(comment.id)}
            disabled={submitting || !replyText.trim()}
            className="self-end bg-primary hover:bg-primary/90 disabled:opacity-50 px-3 py-2 rounded-lg text-primary-foreground text-sm transition-colors"
          >
            Reply
          </button>
        </div>
      )}

      {/* Replies */}
      {replies.map((reply) => (
        <CommentRow
          key={reply.id}
          comment={reply}
          isReply
          currentUserId={currentUserId}
          replyTo={replyTo}
          replyText={replyText}
          setReplyTo={setReplyTo}
          setReplyText={setReplyText}
          submitting={submitting}
          confirmDelete={confirmDelete}
          setConfirmDelete={setConfirmDelete}
          onSubmit={onSubmit}
          onDelete={onDelete}
          onReaction={onReaction}
          replies={repliesMap[reply.id] || []}
          repliesMap={repliesMap}
          replyInputRef={replyInputRef}
        />
      ))}
    </div>
  );
}

export default function CommentsSection({ date }: CommentsSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [giphyResults, setGiphyResults] = useState<GiphyGif[]>([]);
  const [giphyLoading, setGiphyLoading] = useState(false);
  const [giphyQuery, setGiphyQuery] = useState<string | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsub = subscribeToComments(date, setComments, (err) => {
      console.error('Comments listener error:', err);
    });
    return unsub;
  }, [date]);

  useEffect(() => {
    if (replyTo && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [replyTo]);

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesMap: Record<string, Comment[]> = {};
  comments.forEach((c) => {
    if (c.parentId) {
      const effectiveParent =
        comments.find((p) => p.id === c.parentId)?.parentId || c.parentId;
      if (!repliesMap[effectiveParent]) repliesMap[effectiveParent] = [];
      repliesMap[effectiveParent].push(c);
    }
  });

  const handleSubmit = useCallback(async (parentId: string | null = null) => {
    if (!user) return;
    const value = parentId ? replyText : text;
    if (!value.trim()) return;

    // Detect /giphy command
    const giphyMatch = value.trim().match(/^\/giphy\s+(.+)$/i);
    if (giphyMatch) {
      const query = giphyMatch[1].trim();
      setGiphyLoading(true);
      setGiphyQuery(query);
      try {
        const results = await searchGiphy(query);
        setGiphyResults(results);
      } catch {
        alert('Failed to search Giphy. Check your API key.');
        setGiphyResults([]);
        setGiphyQuery(null);
      } finally {
        setGiphyLoading(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      const userData = await getUserDataByUid(user.uid);
      const name = userData?.displayName || user.displayName || user.email?.split('@')[0] || 'User';
      await addComment(date, user.uid, name, value, parentId);
      if (parentId) {
        setReplyText('');
        setReplyTo(null);
      } else {
        setText('');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }, [user, date, replyText, text]);

  const handleGifSelect = useCallback(async (gif: GiphyGif) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const userData = await getUserDataByUid(user.uid);
      const name = userData?.displayName || user.displayName || user.email?.split('@')[0] || 'User';
      await addComment(date, user.uid, name, `/giphy ${giphyQuery}`, null, gif.url);
      setText('');
      setGiphyResults([]);
      setGiphyQuery(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  }, [user, date, giphyQuery]);

  const handleDelete = useCallback(async (commentId: string) => {
    try {
      await deleteComment(date, commentId);
    } catch {
      alert('Failed to delete comment.');
    }
    setConfirmDelete(null);
  }, [date]);

  const handleReaction = useCallback(async (commentId: string, emoji: string, hasReacted: boolean) => {
    if (!user) return;
    try {
      if (hasReacted) {
        await removeReaction(date, commentId, user.uid, emoji);
      } else {
        await addReaction(date, commentId, user.uid, emoji);
      }
    } catch {
      // Silently ignore reaction errors
    }
  }, [user, date]);

  return (
    <Card className="p-2 md:p-6">
      <CardTitle>Comments</CardTitle>

      {/* New comment input */}
      {user && (
        <div className="mt-4">
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment... (try /giphy hello)"
              maxLength={500}
              rows={2}
              className="flex-1 bg-secondary p-3 border border-border rounded-lg text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(null);
                }
              }}
            />
            <button
              onClick={() => handleSubmit(null)}
              disabled={submitting || !text.trim()}
              className="self-end bg-primary hover:bg-primary/90 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold text-primary-foreground text-sm transition-colors"
            >
              Post
            </button>
          </div>

          {/* Giphy picker */}
          {giphyLoading && (
            <p className="mt-2 text-muted-foreground text-xs">Searching Giphy...</p>
          )}
          {giphyResults.length > 0 && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-muted-foreground text-xs">Pick a GIF:</span>
                <button
                  onClick={() => { setGiphyResults([]); setGiphyQuery(null); }}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {giphyResults.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => handleGifSelect(gif)}
                    disabled={submitting}
                    className="overflow-hidden rounded border border-border hover:border-primary transition-colors"
                  >
                    <img
                      src={gif.previewUrl || gif.url}
                      alt={gif.title}
                      className="w-full h-16 object-cover"
                    />
                  </button>
                ))}
              </div>
              <p className="mt-1 text-muted-foreground text-[10px]">Powered by GIPHY</p>
            </div>
          )}
        </div>
      )}

      {/* Comment list */}
      <div className="mt-4 divide-y divide-border">
        {topLevel.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            No comments yet. Be the first!
          </p>
        ) : (
          topLevel.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              currentUserId={user?.uid}
              replyTo={replyTo}
              replyText={replyText}
              setReplyTo={setReplyTo}
              setReplyText={setReplyText}
              submitting={submitting}
              confirmDelete={confirmDelete}
              setConfirmDelete={setConfirmDelete}
              onSubmit={handleSubmit}
              onDelete={handleDelete}
              onReaction={handleReaction}
              replies={repliesMap[comment.id] || []}
              repliesMap={repliesMap}
              replyInputRef={replyInputRef}
            />
          ))
        )}
      </div>
    </Card>
  );
}
