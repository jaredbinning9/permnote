export type Note = {
  id: string;
  content: string;
  created_at: string;
  is_todo: boolean;
  is_done: boolean;
  is_pinned: boolean;
  due_at: string | null;
  archived_at: string | null;
  tags: string[];
  parent_id: string | null;
};