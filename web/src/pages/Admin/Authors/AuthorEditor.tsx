import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLocaleData, getBrowserLocale } from '../../../locales';
import { apiClient } from '../../../shared/api/client';

export default function AuthorEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const locale = getBrowserLocale();
  const t = getLocaleData(locale);
  const [loading, setLoading] = useState(false);

  // Future sections: Overview, Identity, Biography, Timeline, Works, Quotes,
  //                  Knowledge Graph, Media, SEO
  // This component will later render section navigation and sub-forms.
  // For now, redirect to the list page where the modal editor is used.

  useEffect(() => {
    if (id) {
      setLoading(true);
      apiClient.get(`/admin/authors/${id}`)
        .catch(() => {})
        .finally(() => {
          setLoading(false);
          navigate('/admin/authors/list');
        });
    } else {
      navigate('/admin/authors/list');
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        {t.admin.common.loading}
      </div>
    );
  }

  return null;
}
