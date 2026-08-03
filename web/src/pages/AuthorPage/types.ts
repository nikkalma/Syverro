export interface AuthorBook { id: string; title: string; cover: string | null }
export interface TimelineEvent { id: string; event_type: string; date_value: string; date_precision: string; label: string; description: string | null; place_name: string | null; source_title: string | null; extraction_source: string; confidence: number; status: string }
export interface AuthorQuote { id: string; text: string; speaker: string | null; quote_type?: string; source_title: string | null; date_value: string | null; confidence: number; status: string }
export interface AuthorSource { id: string; title: string; source_type: string; url: string | null; citation: string | null }
export interface AuthorRelation { id: string; node_name: string | null; node_type: string | null; relation_type: string; source: string | null; status: string; author_slug?: string | null }
export interface AuthorPublication { id: string; title: string; original_title: string | null; publication_year: number; publication_date: string | null; publication_type: string; description: string | null; pen_name: string | null; wikipedia_url: string | null }
export interface AuthorAward { id: string; name: string; year: number | null; organization: string | null; work: string | null }
export interface AuthorCitizenship { id: string; state_name: string; from_date: string | null; to_date: string | null; notes: string | null; confidence: number; status: string }

export interface PublicAuthorDetail {
  id: string; slug?: string | null; name: string; display_name?: string | null; display_name_mode?: string | null;
  first_name: string | null; last_name: string | null; native_name: string | null; sort_name: string | null;
  nationality: string | null; ethnic_origin: string | null; cultural_identity: string | null; birth_name: string | null;
  pen_names: string[]; pseudonyms: string[]; birth_date: string | null; death_date: string | null;
  birth_place: string | null; birth_place_region: string | null; birth_place_country: string | null;
  death_place: string | null; death_place_region: string | null; death_place_country: string | null;
  biography: string | null; hero_quote: string | null; about_summary: string | null; occupations: string[];
  photo_url: string | null; hero_background_url?: string | null; author_intro_quote?: string | null;
  books: AuthorBook[]; timeline_events: TimelineEvent[]; quotes: AuthorQuote[]; sources: AuthorSource[];
  knowledge_relations: AuthorRelation[]; publications: AuthorPublication[]; awards: AuthorAward[]; citizenships: AuthorCitizenship[];
}
