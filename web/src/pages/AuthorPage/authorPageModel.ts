import type { PublicAuthorDetail } from './types';

export const mapPublicAuthorDetail = (value: Partial<PublicAuthorDetail> & Pick<PublicAuthorDetail, 'id' | 'name'>): PublicAuthorDetail => ({
  first_name: null, last_name: null, native_name: null, sort_name: null, nationality: null, ethnic_origin: null,
  cultural_identity: null, birth_name: null, birth_date: null, death_date: null, birth_place: null,
  birth_place_region: null, birth_place_country: null, death_place: null, death_place_region: null,
  death_place_country: null, biography: null, hero_quote: null, about_summary: null, photo_url: null,
  ...value,
  pen_names: value.pen_names ?? [], pseudonyms: value.pseudonyms ?? [], occupations: value.occupations ?? [],
  books: value.books ?? [], timeline_events: value.timeline_events ?? [], quotes: value.quotes ?? [],
  sources: value.sources ?? [], knowledge_relations: value.knowledge_relations ?? [], publications: value.publications ?? [],
  awards: value.awards ?? [], citizenships: value.citizenships ?? [],
});

export const splitAuthorQuotes = (quotes: PublicAuthorDetail['quotes']) => ({
  byAuthor: quotes.filter((quote) => quote.quote_type !== 'about_author'),
  aboutAuthor: quotes.filter((quote) => quote.quote_type === 'about_author'),
});

export const authorSectionVisibility = (author: PublicAuthorDetail) => ({
  about: Boolean(author.about_summary || author.biography || author.occupations.length || author.nationality || author.awards.length || author.citizenships.length),
  works: author.books.length > 0 || author.publications.length > 0,
  chronology: author.timeline_events.length > 0,
  quotes: author.quotes.length > 0,
  atmosphere: getApprovedAtmospheres(author).length > 0,
  sources: author.sources.length > 0,
});

export const getApprovedAtmospheres = (author: PublicAuthorDetail) => {
  const names = author.knowledge_relations
    .filter((relation) => relation.status === 'approved' && relation.node_type === 'atmosphere' && relation.relation_type === 'atmosphere')
    .map((relation) => relation.node_name?.trim())
    .filter((name): name is string => Boolean(name));
  return names.filter((name, index) => names.findIndex((candidate) => candidate.toLocaleLowerCase() === name.toLocaleLowerCase()) === index);
};

export const formatStoredPlace = (...parts: Array<string | null | undefined>) =>
  parts.filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index).join(', ');
