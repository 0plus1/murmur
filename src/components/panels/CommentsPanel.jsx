/**
 * Comments Panel - local-only document comments stored in IndexedDB
 */
import React from 'react';
import { MessageSquare, Plus, Trash2, CornerDownRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useEditorStore } from '@/stores';

function formatCommentTimestamp(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '';
  }
}

function CommentAnchor({ comment }) {
  if (comment.selectedText) {
    return (
      <div className="mt-2 rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
        <div className="mb-1 flex items-center gap-1">
          <CornerDownRight className="h-3 w-3" />
          <span>Anchored selection</span>
        </div>
        <p className="line-clamp-3 whitespace-pre-wrap break-words">"{comment.selectedText}"</p>
      </div>
    );
  }

  if (typeof comment.anchorOffset === 'number') {
    return (
      <div className="mt-2 text-xs text-muted-foreground">
        Anchor offset: {comment.anchorOffset}
      </div>
    );
  }

  return null;
}

function DraftAnchor({ draft }) {
  if (!draft) return null;

  if (draft.selectedText) {
    return (
      <p className="mt-1 text-xs text-muted-foreground line-clamp-3" data-testid="comment-draft-anchor">
        Replying to selection: "{draft.selectedText}"
      </p>
    );
  }

  if (typeof draft.anchorOffset === 'number') {
    return (
      <p className="mt-1 text-xs text-muted-foreground" data-testid="comment-draft-anchor">
        Anchor offset: {draft.anchorOffset}
      </p>
    );
  }

  return (
    <p className="mt-1 text-xs text-muted-foreground" data-testid="comment-draft-anchor">
      General document comment
    </p>
  );
}

export function CommentsPanel({ onSelectComment }) {
  const currentDocument = useEditorStore((state) => state.currentDocument);
  const comments = useEditorStore((state) => state.comments);
  const commentDraft = useEditorStore((state) => state.commentDraft);
  const beginCommentDraft = useEditorStore((state) => state.beginCommentDraft);
  const updateCommentDraftBody = useEditorStore((state) => state.updateCommentDraftBody);
  const cancelCommentDraft = useEditorStore((state) => state.cancelCommentDraft);
  const saveCommentDraft = useEditorStore((state) => state.saveCommentDraft);
  const deleteComment = useEditorStore((state) => state.deleteComment);

  const handleStartGeneralComment = () => {
    beginCommentDraft();
  };

  if (!currentDocument) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground" data-testid="comments-panel-empty">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Select a document to view comments</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col" data-testid="comments-panel">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Comments ({comments.length})
            </h3>
            <p className="mt-1 text-xs text-muted-foreground truncate">
              {currentDocument.title}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1"
            onClick={handleStartGeneralComment}
            data-testid="comments-add-btn"
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
      </div>

      {commentDraft && (
        <div className="border-b p-4" data-testid="comment-draft-composer">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            New Comment
          </label>
          <DraftAnchor draft={commentDraft} />
          <Textarea
            value={commentDraft.body || ''}
            onChange={(e) => updateCommentDraftBody(e.target.value)}
            placeholder="Write a comment..."
            className="mt-3 min-h-24 resize-y"
            data-testid="comment-draft-textarea"
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelCommentDraft}
              data-testid="comment-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveCommentDraft}
              disabled={!commentDraft.body?.trim()}
              data-testid="comment-save-btn"
            >
              Save comment
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {comments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground" data-testid="comments-list-empty">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No comments yet.</p>
              <p className="mt-1 text-xs">Right-click in the editor to add a comment.</p>
              {!commentDraft && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleStartGeneralComment}
                  data-testid="comments-empty-add-btn"
                >
                  Add general comment
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectComment?.(comment)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectComment?.(comment);
                    }
                  }}
                  data-testid={`comment-item-${comment.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {formatCommentTimestamp(comment.createdAt)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteComment(comment.id);
                      }}
                      data-testid={`delete-comment-${comment.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">{comment.body}</p>
                  <CommentAnchor comment={comment} />
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default CommentsPanel;
