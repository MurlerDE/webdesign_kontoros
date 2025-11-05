import { useState, useEffect } from 'react';
import './ContactsManagement.scss';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  customerId: string;
  customerName: string;
  isPrimary: boolean;
}

export default function ContactsManagement() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    // TODO: Fetch contacts from API
    // Dummy data for now
    const dummyContacts: Contact[] = [
      {
        id: '1',
        name: 'Max Mustermann',
        email: 'max@musterfirma.de',
        phone: '+49 123 456789',
        position: 'Geschäftsführer',
        customerId: '1',
        customerName: 'Musterfirma GmbH',
        isPrimary: true,
      },
      {
        id: '2',
        name: 'Anna Schmidt',
        email: 'anna.schmidt@musterfirma.de',
        phone: '+49 123 456790',
        position: 'Projektleiterin',
        customerId: '1',
        customerName: 'Musterfirma GmbH',
        isPrimary: false,
      },
      {
        id: '3',
        name: 'Thomas Weber',
        email: 'thomas@beispiel-ag.de',
        phone: '+49 987 654321',
        position: 'IT-Leiter',
        customerId: '2',
        customerName: 'Beispiel AG',
        isPrimary: true,
      },
    ];

    setTimeout(() => {
      setContacts(dummyContacts);
      setLoading(false);
    }, 500);
  }, []);

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterCustomer === 'all' || contact.customerId === filterCustomer;

    return matchesSearch && matchesFilter;
  });

  const uniqueCustomers = Array.from(
    new Set(contacts.map((c) => JSON.stringify({ id: c.customerId, name: c.customerName })))
  ).map((str) => JSON.parse(str));

  const handleEdit = (contactId: string) => {
    console.log('Edit contact:', contactId);
    // TODO: Implement edit functionality
  };

  const handleDelete = (contactId: string) => {
    if (window.confirm('Möchten Sie diesen Kontakt wirklich löschen?')) {
      console.log('Delete contact:', contactId);
      // TODO: Implement delete functionality
    }
  };

  if (loading) {
    return (
      <div className="contacts-management-loading">
        <div className="spinner"></div>
        <p>Lädt Kontakte...</p>
      </div>
    );
  }

  return (
    <div className="contacts-management">
      <div className="contacts-management__header">
        <h1>Kontaktverwaltung</h1>
        <button onClick={() => setShowAddModal(true)} className="btn btn--primary">
          + Neuer Kontakt
        </button>
      </div>

      <div className="contacts-management__filters">
        <div className="search-box">
          <input
            type="search"
            placeholder="Kontakte durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-box">
          <label htmlFor="customer-filter">Kunde filtern:</label>
          <select
            id="customer-filter"
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            className="filter-select"
          >
            <option value="all">Alle Kunden</option>
            {uniqueCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="contacts-management__stats">
        <div className="stat-card">
          <span className="stat-value">{contacts.length}</span>
          <span className="stat-label">Gesamt Kontakte</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{contacts.filter((c) => c.isPrimary).length}</span>
          <span className="stat-label">Hauptansprechpartner</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{uniqueCustomers.length}</span>
          <span className="stat-label">Kunden</span>
        </div>
      </div>

      <div className="contacts-management__list">
        {filteredContacts.length === 0 ? (
          <div className="no-results">
            <p>Keine Kontakte gefunden</p>
          </div>
        ) : (
          <div className="contacts-grid">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="contact-card">
                <div className="contact-card__header">
                  <div className="contact-info">
                    <h3>{contact.name}</h3>
                    {contact.isPrimary && (
                      <span className="primary-badge">Hauptansprechpartner</span>
                    )}
                  </div>
                  <div className="contact-actions">
                    <button
                      onClick={() => handleEdit(contact.id)}
                      className="action-btn"
                      title="Bearbeiten"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="action-btn action-btn--danger"
                      title="Löschen"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="contact-card__body">
                  {contact.position && (
                    <div className="contact-detail">
                      <span className="detail-icon">💼</span>
                      <span>{contact.position}</span>
                    </div>
                  )}
                  <div className="contact-detail">
                    <span className="detail-icon">✉</span>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </div>
                  {contact.phone && (
                    <div className="contact-detail">
                      <span className="detail-icon">📞</span>
                      <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                    </div>
                  )}
                  <div className="contact-detail customer-link">
                    <span className="detail-icon">🏢</span>
                    <span>{contact.customerName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Neuen Kontakt hinzufügen</h3>
            <p>Diese Funktion wird in Kürze verfügbar sein.</p>
            <div className="modal-actions">
              <button onClick={() => setShowAddModal(false)} className="btn btn--secondary">
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
