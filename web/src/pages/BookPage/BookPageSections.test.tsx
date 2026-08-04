import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { en } from '../../locales';
import type { PublicBookDetail } from '../../types/bookDetail';
import { Bibliography, BookIdentity, BookMapPreview, Chronology, NarrativeForm, ReaderFit } from './BookPageSections';

const book: PublicBookDetail = {
  id: 'book-1', slug: 'jane-eyre', title: 'Jane Eyre', subtitle: null, originalTitle: 'Jane Eyre',
  description: 'A novel.', cover: null, publicationId: null, publicationYear: 1847,
  originalLanguage: 'English', countryOfOrigin: 'United Kingdom', totalPages: 672,
  publicationType: 'official', seriesName: null, seriesPosition: null, authors: [], publication: null,
  genres: [{ id: 'genre-1', name: 'Gothic Novel', slug: 'gothic-novel', type: 'literary' }],
  knowledge: [
    { nodeId: 'theme-1', name: 'Identity', slug: 'identity', nodeType: 'theme', relationType: 'explores', confidence: 1, source: 'curator', metadata: null },
    { nodeId: 'motif-1', name: 'Fire', slug: 'fire', nodeType: 'motif', relationType: 'contains', confidence: 1, source: 'curator', metadata: null },
  ],
};

describe('BookPage editorial sections', () => {
  it('renders localized narrative empty state without inventing analysis', () => {
    render(<NarrativeForm copy={en.bookPage} />);
    expect(screen.getByRole('heading', { name: en.bookPage.howToldTitle })).toBeInTheDocument();
    expect(screen.getByText(en.bookPage.howToldEmpty)).toBeInTheDocument();
  });

  it('keeps existing knowledge compact in the identity area', () => {
    render(<BookIdentity book={book} copy={en.bookPage} onAuthor={vi.fn()} onTag={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Gothic Novel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Identity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fire' })).toBeInTheDocument();
    expect(screen.getByText(en.bookPage.genres)).toBeInTheDocument();
    expect(screen.getByText(en.bookPage.themes)).toBeInTheDocument();
    expect(screen.getByText(en.bookPage.motifs)).toBeInTheDocument();
    expect(screen.queryByText(en.bookPage.concepts)).not.toBeInTheDocument();
    expect(screen.queryByText(en.bookPage.atmospheres)).not.toBeInTheDocument();
  });

  it('localizes the stored publication type without changing its value', () => {
    render(<Bibliography book={book} copy={en.bookPage} onTag={vi.fn()} />);
    expect(screen.getByText(en.bookPage.publicationTypes.official)).toBeInTheDocument();
    expect(screen.queryByText('official')).not.toBeInTheDocument();
  });

  it('does not render edition-specific page count or leave a metadata separator', () => {
    const { container } = render(<>
      <BookIdentity book={book} copy={en.bookPage} onAuthor={vi.fn()} onTag={vi.fn()} />
      <Bibliography book={book} copy={en.bookPage} onTag={vi.fn()} />
    </>);
    expect(screen.queryByText('672')).not.toBeInTheDocument();
    expect(screen.queryByText(en.bookPage.metadata.pages)).not.toBeInTheDocument();
    const metadata = container.querySelector('.book-page__identity-meta');
    expect(metadata).toHaveTextContent('1847');
    expect(metadata?.children).toHaveLength(1);
    expect(metadata).not.toHaveTextContent('·');
  });

  it('keeps Sapphire transition visible but inactive', () => {
    render(<BookMapPreview book={book} copy={en.bookPage} />);
    const action = screen.getByRole('button', { name: new RegExp(en.bookPage.openSapphire) });
    expect(action).toBeDisabled();
  });

  it('renders only approved future empty states', () => {
    render(<><ReaderFit copy={en.bookPage} /><Chronology copy={en.bookPage} /></>);
    expect(screen.getByText(en.bookPage.readerFitEmpty)).toBeInTheDocument();
    expect(screen.getByText(en.bookPage.chronologyEmpty)).toBeInTheDocument();
  });
});
