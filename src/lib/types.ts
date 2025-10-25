export type Note = {
  id: string;
  content: string;
  iv: string;
  salt: string | null;
  has_password: 0 | 1;
  expires_at: number | null;
  views_remaining: number | null;
  created_at: number;
};
