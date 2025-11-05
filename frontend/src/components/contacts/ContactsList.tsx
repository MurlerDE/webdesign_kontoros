import { useState, useEffect } from 'react';
import './ContactsList.scss';

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

interface ContactsListProps {
  customerId?: string; // Optional: show only contacts for specific customer
}

export default function ContactsList({ customerId }: ContactsListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Filter by customerId if provided
    const filteredContacts = customerId
      ? dummyContacts.filter((c) => c.customerId === customerId)
      : dummyContacts;

    setTimeout(() => {
      setContacts(filteredContacts);
      setLoading(false);
    }, 300);
  }, [customerId]);

  if (loading) {
    return <div className="contacts-list-loading">Lädt Kontakte...</div>;
  }

  if (contacts.length === 0) {
    return (
      <div className="contacts-list-empty">
        <p>Keine Kontakte vorhanden</p>
      </div>
    );
  }

  return (
    <div className="contacts-list">
      <div className="contacts-list__table-wrapper">
        <table className="contacts-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>E-Mail</th>
              <th>Telefon</th>
              {!customerId && <th>Kunde</th>}
              <th>Rolle</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td className="contact-name">{contact.name}</td>
                <td>{contact.position || '-'}</td>
                <td>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </td>
                <td>
                  {contact.phone ? (
                    <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                  ) : (
                    '-'
                  )}
                </td>
                {!customerId && <td>{contact.customerName}</td>}
                <td>
                  {contact.isPrimary && (
                    <span className="primary-badge">Hauptansprechpartner</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
