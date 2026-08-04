\set ON_ERROR_STOP on

BEGIN;

DO $reconcile$
DECLARE
    current_revision text;
    constraint_count integer;
    constraint_definition text;
BEGIN
    SELECT version_num INTO STRICT current_revision FROM alembic_version;
    IF current_revision <> '0012_quote_type' THEN
        RAISE EXCEPTION 'Expected Alembic revision 0012_quote_type, found %', current_revision;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='authors' AND column_name='themes' AND data_type='ARRAY' AND udt_name='_varchar' AND is_nullable='YES' AND column_default='''{}''::character varying[]') THEN RAISE EXCEPTION 'authors.themes does not match 0013'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='authors' AND column_name='motifs' AND data_type='ARRAY' AND udt_name='_varchar' AND is_nullable='YES' AND column_default='''{}''::character varying[]') THEN RAISE EXCEPTION 'authors.motifs does not match 0013'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='authors' AND column_name='concepts' AND data_type='ARRAY' AND udt_name='_varchar' AND is_nullable='YES' AND column_default='''{}''::character varying[]') THEN RAISE EXCEPTION 'authors.concepts does not match 0013'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='authors' AND column_name='atmospheres' AND data_type='ARRAY' AND udt_name='_varchar' AND is_nullable='YES' AND column_default='''{}''::character varying[]') THEN RAISE EXCEPTION 'authors.atmospheres does not match 0013'; END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='knowledge_nodes' AND column_name='author_id' AND data_type='uuid' AND is_nullable='YES' AND column_default IS NULL) THEN RAISE EXCEPTION 'knowledge_nodes.author_id does not match 0013'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='books' AND column_name='publication_id' AND data_type='uuid' AND is_nullable='YES' AND column_default IS NULL) THEN RAISE EXCEPTION 'books.publication_id does not match 0014'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='knowledge_nodes' AND column_name='place_id' AND data_type='uuid' AND is_nullable='YES' AND column_default IS NULL) THEN RAISE EXCEPTION 'knowledge_nodes.place_id does not match 0015'; END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='knowledge_nodes' AND column_name='description' AND data_type='text' AND is_nullable='YES' AND column_default IS NULL) THEN RAISE EXCEPTION 'knowledge_nodes.description does not match 0016'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='knowledge_nodes' AND column_name='status' AND data_type='character varying' AND is_nullable='NO' AND column_default='''draft''::character varying') THEN RAISE EXCEPTION 'knowledge_nodes.status does not match 0016'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='knowledge_nodes' AND column_name='is_sapphire' AND data_type='boolean' AND is_nullable='NO' AND column_default='false') THEN RAISE EXCEPTION 'knowledge_nodes.is_sapphire does not match 0016'; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='knowledge_nodes' AND column_name='explorer_visible' AND data_type='boolean' AND is_nullable='NO' AND column_default='false') THEN RAISE EXCEPTION 'knowledge_nodes.explorer_visible does not match 0016'; END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid JOIN pg_class t ON t.oid=x.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace
        WHERE n.nspname='public' AND t.relname='knowledge_nodes' AND i.relname='ix_knowledge_nodes_author_id' AND x.indisvalid AND NOT x.indisunique
          AND pg_get_indexdef(i.oid)='CREATE INDEX ix_knowledge_nodes_author_id ON public.knowledge_nodes USING btree (author_id)'
    ) THEN RAISE EXCEPTION 'ix_knowledge_nodes_author_id does not match 0013'; END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid JOIN pg_class t ON t.oid=x.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace
        WHERE n.nspname='public' AND t.relname='books' AND i.relname='ix_books_publication_id' AND x.indisvalid AND NOT x.indisunique
          AND pg_get_indexdef(i.oid)='CREATE INDEX ix_books_publication_id ON public.books USING btree (publication_id)'
    ) THEN RAISE EXCEPTION 'ix_books_publication_id does not match 0014'; END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid JOIN pg_class t ON t.oid=x.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace
        WHERE n.nspname='public' AND t.relname='knowledge_nodes' AND i.relname='ix_knowledge_nodes_place_id' AND x.indisvalid AND NOT x.indisunique
          AND pg_get_indexdef(i.oid)='CREATE INDEX ix_knowledge_nodes_place_id ON public.knowledge_nodes USING btree (place_id)'
    ) THEN RAISE EXCEPTION 'ix_knowledge_nodes_place_id does not match 0015'; END IF;

    SELECT count(*), min(pg_get_constraintdef(oid)) INTO constraint_count, constraint_definition FROM pg_constraint
     WHERE conrelid='public.knowledge_nodes'::regclass AND conname IN ('knowledge_nodes_author_id_fkey','fk_knowledge_nodes_author_id') AND contype='f' AND convalidated;
    IF constraint_count<>1 OR constraint_definition<>'FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL' THEN RAISE EXCEPTION 'knowledge_nodes.author_id FK precondition differs'; END IF;

    SELECT count(*), min(pg_get_constraintdef(oid)) INTO constraint_count, constraint_definition FROM pg_constraint
     WHERE conrelid='public.books'::regclass AND conname IN ('books_publication_id_fkey','fk_books_publication_id') AND contype='f' AND convalidated;
    IF constraint_count<>1 OR constraint_definition<>'FOREIGN KEY (publication_id) REFERENCES author_publications(id) ON DELETE SET NULL' THEN RAISE EXCEPTION 'books.publication_id FK precondition differs'; END IF;

    SELECT count(*), min(pg_get_constraintdef(oid)) INTO constraint_count, constraint_definition FROM pg_constraint
     WHERE conrelid='public.knowledge_nodes'::regclass AND conname IN ('knowledge_nodes_place_id_fkey','fk_knowledge_nodes_place_id') AND contype='f' AND convalidated;
    IF constraint_count<>1 OR constraint_definition<>'FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE SET NULL' THEN RAISE EXCEPTION 'knowledge_nodes.place_id FK precondition differs'; END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.knowledge_nodes'::regclass AND conname='knowledge_nodes_author_id_fkey') THEN ALTER TABLE public.knowledge_nodes RENAME CONSTRAINT knowledge_nodes_author_id_fkey TO fk_knowledge_nodes_author_id; END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.books'::regclass AND conname='books_publication_id_fkey') THEN ALTER TABLE public.books RENAME CONSTRAINT books_publication_id_fkey TO fk_books_publication_id; END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.knowledge_nodes'::regclass AND conname='knowledge_nodes_place_id_fkey') THEN ALTER TABLE public.knowledge_nodes RENAME CONSTRAINT knowledge_nodes_place_id_fkey TO fk_knowledge_nodes_place_id; END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.knowledge_nodes'::regclass AND conname='fk_knowledge_nodes_author_id' AND convalidated AND pg_get_constraintdef(oid)='FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL') THEN RAISE EXCEPTION 'Final fk_knowledge_nodes_author_id verification failed'; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.books'::regclass AND conname='fk_books_publication_id' AND convalidated AND pg_get_constraintdef(oid)='FOREIGN KEY (publication_id) REFERENCES author_publications(id) ON DELETE SET NULL') THEN RAISE EXCEPTION 'Final fk_books_publication_id verification failed'; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.knowledge_nodes'::regclass AND conname='fk_knowledge_nodes_place_id' AND convalidated AND pg_get_constraintdef(oid)='FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE SET NULL') THEN RAISE EXCEPTION 'Final fk_knowledge_nodes_place_id verification failed'; END IF;
END
$reconcile$;

COMMIT;
