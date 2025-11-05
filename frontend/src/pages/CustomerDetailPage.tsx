import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './CustomerDetailPage.scss';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // TODO: Fetch customer from API
    // Dummy data for now
    const dummyCustomer: Customer = {
      id: id || '1',
      name: 'Max Mustermann',
      email: 'max@example.com',
      phone: '+49 123 456789',
      company: 'Musterfirma GmbH',
      address: 'Musterstraße 123',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Deutschland',
      notes: 'Wichtiger Kunde, bevorzugte Kommunikation per E-Mail.',
      status: 'active',
      createdAt: '2024-01-15T10:30:00',
      updatedAt: '2024-03-20T14:45:00',
    };

    setTimeout(() => {
      setCustomer(dummyCustomer);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleDelete = async () => {
    if (!customer) return;

    try {
      // TODO: Call API to delete customer
      console.log('Deleting customer:', customer.id);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      navigate('/customers');
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  if (loading) {
    return (
      <div className="customer-detail-loading">
        <div className="spinner"></div>
        <p>Lädt Kundendetails...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="customer-detail-error">
        <h2>Kunde nicht gefunden</h2>
        <p>Der angeforderte Kunde konnte nicht gefunden werden.</p>
        <Link to="/customers" className="btn btn--primary">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="customer-detail">
      <div className="customer-detail__header">
        <div className="header-left">
          <Link to="/customers" className="back-link">
            ← Zurück zur Übersicht
          </Link>
          <div className="title-section">
            <h1>{customer.name}</h1>
            <span className={`status-badge status-badge--${customer.status}`}>
              {customer.status === 'active' ? 'Aktiv' : 'Inaktiv'}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <Link to={`/customers/${customer.id}/edit`} className="btn btn--primary">
            Bearbeiten
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn--danger"
          >
            Löschen
          </button>
        </div>
      </div>

      <div className="customer-detail__content">
        <div className="info-section">
          <h2>Kontaktinformationen</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">E-Mail</span>
              <span className="info-value">
                <a href={`mailto:${customer.email}`}>{customer.email}</a>
              </span>
            </div>
            {customer.phone && (
              <div className="info-item">
                <span className="info-label">Telefon</span>
                <span className="info-value">
                  <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                </span>
              </div>
            )}
            {customer.company && (
              <div className="info-item">
                <span className="info-label">Firma</span>
                <span className="info-value">{customer.company}</span>
              </div>
            )}
          </div>
        </div>

        {(customer.address || customer.city || customer.postalCode || customer.country) && (
          <div className="info-section">
            <h2>Adresse</h2>
            <div className="info-grid">
              {customer.address && (
                <div className="info-item">
                  <span className="info-label">Straße</span>
                  <span className="info-value">{customer.address}</span>
                </div>
              )}
              {customer.postalCode && (
                <div className="info-item">
                  <span className="info-label">PLZ</span>
                  <span className="info-value">{customer.postalCode}</span>
                </div>
              )}
              {customer.city && (
                <div className="info-item">
                  <span className="info-label">Stadt</span>
                  <span className="info-value">{customer.city}</span>
                </div>
              )}
              {customer.country && (
                <div className="info-item">
                  <span className="info-label">Land</span>
                  <span className="info-value">{customer.country}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {customer.notes && (
          <div className="info-section">
            <h2>Notizen</h2>
            <p className="notes-content">{customer.notes}</p>
          </div>
        )}

        <div className="info-section">
          <h2>Metadaten</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Erstellt am</span>
              <span className="info-value">
                {new Date(customer.createdAt).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {customer.updatedAt && (
              <div className="info-item">
                <span className="info-label">Zuletzt bearbeitet</span>
                <span className="info-value">
                  {new Date(customer.updatedAt).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Kunde löschen?</h3>
            <p>
              Möchten Sie den Kunden <strong>{customer.name}</strong> wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn--secondary"
              >
                Abbrechen
              </button>
              <button onClick={handleDelete} className="btn btn--danger">
                Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
