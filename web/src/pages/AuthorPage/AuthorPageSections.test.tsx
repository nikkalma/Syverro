import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { en } from '../../locales';
import { authorSectionVisibility, mapPublicAuthorDetail, splitAuthorQuotes } from './authorPageModel';
import { AuthorAbout, AuthorHero, AuthorQuotes } from './AuthorPageSections';

const author = mapPublicAuthorDetail({
  id: 'author-1', name: 'Virginia Woolf', display_name: 'Virginia Woolf', native_name: 'Adeline Virginia Woolf',
  birth_date: '1882-01-25', death_date: '1941-03-28', nationality: 'English',
  about_summary: 'English writer and modernist.', hero_quote: 'A woman must have money and a room of her own.',
  quotes: [
    { id: 'q1', text: 'Arrange whatever pieces come your way.', speaker: 'Virginia Woolf', quote_type: 'by_author', source_title: null, date_value: null, confidence: 1, status: 'approved' },
    { id: 'q2', text: 'She changed the novel.', speaker: 'A critic', quote_type: 'about_author', source_title: null, date_value: null, confidence: 1, status: 'approved' },
  ],
});

describe('AuthorPage reference sections', () => {
  it('renders the hero hierarchy from real author data', () => {
    render(<AuthorHero author={author} t={en.author} />);
    expect(screen.getByRole('heading', { name: 'Virginia Woolf' })).toBeInTheDocument();
    expect(screen.getByText('Adeline Virginia Woolf')).toBeInTheDocument();
    expect(screen.getByText(author.hero_quote!)).toBeInTheDocument();
  });

  it('separates quotes by and about the author', () => {
    expect(splitAuthorQuotes(author.quotes)).toMatchObject({ byAuthor: [{ id: 'q1' }], aboutAuthor: [{ id: 'q2' }] });
    render(<MemoryRouter><AuthorQuotes author={author} t={en.author} /></MemoryRouter>);
    expect(screen.getByText('Arrange whatever pieces come your way.')).toBeInTheDocument();
    expect(screen.getByText('She changed the novel.')).toBeInTheDocument();
  });

  it('omits unsupported sections when no real data exists', () => {
    const visibility = authorSectionVisibility(mapPublicAuthorDetail({ id: 'empty', name: 'Unknown' }));
    expect(visibility).toEqual({ about: false, works: false, chronology: false, quotes: false, relations: false, sources: false });
  });

  it('renders stored editorial values without translating them', () => {
    const stored = { ...author, cultural_identity: 'Victorian English literature' };
    render(<AuthorAbout author={stored} t={en.author} />);
    expect(screen.getByText('Victorian English literature')).toBeInTheDocument();
  });
});
