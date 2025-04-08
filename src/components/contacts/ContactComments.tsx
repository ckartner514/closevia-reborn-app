
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

type ContactComment = {
  id: string;
  contact_id: string;
  text: string;
  created_at: string;
  user_id: string;
};

interface ContactCommentsProps {
  comments: ContactComment[];
  newComment: string;
  isLoading: boolean;
  onCommentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAddComment: () => void;
  onDeleteComment: (commentId: string) => void;
}

const ContactComments = ({
  comments,
  newComment,
  isLoading,
  onCommentChange,
  onAddComment,
  onDeleteComment
}: ContactCommentsProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Comments</h3>
      
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={onCommentChange}
          className="flex-1"
        />
        <Button 
          onClick={onAddComment} 
          disabled={!newComment.trim() || isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
        </Button>
      </div>
      
      <div className="space-y-4 max-h-[300px] overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border rounded-md p-3 bg-background">
              <div className="flex justify-between items-start">
                <p className="whitespace-pre-wrap">{comment.text}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteComment(comment.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {format(parseISO(comment.created_at), "PPP p")}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactComments;
