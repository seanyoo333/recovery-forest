DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'reference'
    ) THEN
ALTER TABLE "posts" ADD COLUMN "reference" text;
    END IF;
END $$;