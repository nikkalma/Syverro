# Canonical Work authorship

`AuthorPublication` is Syverro's canonical intellectual Work-equivalent. Its
UUID is stable across translations, editions, localized titles, covers, and
other catalog representations.

The authoritative path is:

```text
Author
  -> author_publication_authors
  -> AuthorPublication
  -> books.publication_id
  -> Book representation(s)
```

`author_publication_authors` is the only authority for Work authorship. A Work
has one row per canonical Author. `position` is contiguous from 1 and defines
credit order. `credited_name` is optional and records a pen name or the exact
Work credit without creating another Author.

`AuthorPublication.author_id` and `pen_name` remain compatibility caches. They
mirror the position-1 authorship row. Application writes must use the Work
authorship service so the caches cannot diverge.

`book_authors` remains the authority for authors displayed on a particular
Book/catalog representation. `Book.author_id` and `Book.author` remain legacy
display caches. When a Book is linked to an AuthorPublication, the set of
stable Author IDs in `book_authors` must exactly equal the canonical Work
author set. Display strings and title matching are never authorities.

Editor, translator, narrator, illustrator, and foreword credits are outside
this association. A future contributor model should represent those roles
explicitly rather than treating them as Work authors.

Work semantic ownership is intentionally unchanged in this slice. Approved
relations still attach through `BookKnowledgeRelation`; a later focused slice
must decide how to migrate them to canonical Work identity without copying
semantics onto Author.
