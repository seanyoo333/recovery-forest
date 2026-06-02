/**
 * Placeholder Supabase types.
 *
 * Regenerate from your new Supabase project after applying the
 * sql/recovery-forest/0001_init.sql migration:
 *
 *   npm run db:typegen
 *
 * (The script in package.json calls `supabase gen types typescript --project-id ...`
 * — update the project-id to your recovery-forest Supabase project.)
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
