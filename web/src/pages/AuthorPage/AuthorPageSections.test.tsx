import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { en } from '../../locales';
import { authorSectionVisibility, getApprovedAtmospheres, mapPublicAuthorDetail, splitAuthorQuotes } from './authorPageModel';
import { AuthorAbout, AuthorAtmosphere, AuthorHero, AuthorQuotes, AuthorSources, AuthorWorks } from './AuthorPageSections';

const author = mapPublicAuthorDetail({
  id: 'author-1', name: 'Virginia Woolf', display_name: 'Virginia Woolf', native_name: 'Adeline Virginia Woolf',
  birth_date: '1882-01-25', death_date: '1941-03-28', nationality: 'English',
  about_summary: 'English writer and modernist.', hero_quote: 'A woman must have money and a room of her own.',
  books: [{ id: 'book-1', title: 'Mrs Dalloway', cover: '/covers/mrs-dalloway.jpg' }],
  publications: [{ id: 'publication-1', title: 'To the Lighthouse', original_title: null, publication_year: 1927, publication_date: null, publication_type: 'novel', description: null, pen_name: null, wikipedia_url: null }],
  sources: [{ id: 'source-1', title: 'The Virginia Woolf Society', source_type: 'website', url: 'https://example.com', citation: null }],
  knowledge_relations: [
    { id: 'atmosphere-1', node_name: 'Reflective', node_type: 'atmosphere', relation_type: 'atmosphere', source: 'editorial', status: 'approved' },
    { id: 'theme-1', node_name: 'Identity', node_type: 'theme', relation_type: 'theme', source: 'editorial', status: 'approved' },
    { id: 'person-1', node_name: 'Leonard Woolf', node_type: 'person', relation_type: 'relative_of', source: 'editorial', status: 'approved' },
    { id: 'draft-atmosphere', node_name: 'Unreviewed', node_type: 'atmosphere', relation_type: 'atmosphere', source: 'editorial', status: 'draft' },
  ],
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
    expect(screen.queryByText(author.about_summary!)).not.toBeInTheDocument();
  });

  it('separates quotes by and about the author', () => {
    expect(splitAuthorQuotes(author.quotes)).toMatchObject({ byAuthor: [{ id: 'q1' }], aboutAuthor: [{ id: 'q2' }] });
    render(<MemoryRouter><AuthorQuotes author={author} t={en.author} /></MemoryRouter>);
    expect(screen.getByText('Arrange whatever pieces come your way.')).toBeInTheDocument();
    expect(screen.getByText('She changed the novel.')).toBeInTheDocument();
  });

  it('omits unsupported sections when no real data exists', () => {
    const visibility = authorSectionVisibility(mapPublicAuthorDetail({ id: 'empty', name: 'Unknown' }));
    expect(visibility).toEqual({ about: false, works: false, chronology: false, quotes: false, atmosphere: false, sources: false });
    expect(visibility).not.toHaveProperty('relations');
  });

  it('renders stored editorial values without translating them', () => {
    const stored = { ...author, cultural_identity: 'Victorian English literature' };
    render(<AuthorAbout author={stored} t={en.author} />);
    expect(screen.getByText('Victorian English literature')).toBeInTheDocument();
  });

  it('renders only approved atmosphere relations', () => {
    expect(getApprovedAtmospheres(author)).toEqual(['Reflective']);
    render(<AuthorAtmosphere author={author} t={en.author} />);
    expect(screen.getByText('Reflective')).toBeInTheDocument();
    expect(screen.queryByText('Identity')).not.toBeInTheDocument();
    expect(screen.queryByText('Leonard Woolf')).not.toBeInTheDocument();
    expect(screen.queryByText('Unreviewed')).not.toBeInTheDocument();
  });

  it('renders real books and publications in the works rail', () => {
    render(<MemoryRouter><AuthorWorks author={author} t={en.author} /></MemoryRouter>);
    expect(screen.getByText('Mrs Dalloway')).toBeInTheDocument();
    expect(screen.getByText('To the Lighthouse')).toBeInTheDocument();
    expect(screen.getByText('1927')).toBeInTheDocument();
  });

  it('keeps Sources as a disclosure block', () => {
    render(<AuthorSources author={author} t={en.author} />);
    expect(screen.getByText(en.author.sources).closest('summary')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'The Virginia Woolf Society' })).toBeInTheDocument();
  });
});
