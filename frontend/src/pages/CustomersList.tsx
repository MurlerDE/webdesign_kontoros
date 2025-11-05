import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CustomersList.scss';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // TODO: Fetch customers from API
    // Dummy data for now
    const dummyData: Customer[] = [
      {
        id: '1',
        name: 'Max Mustermann',
        email: 'max@example.com',
        phone: '+49 123 456789',
        company: 'Musterfirma GmbH',
        status: 'active',
        createdAt: '2024-01-15',
      },
      {
        id: '2',
        name: 'Erika Musterfrau',
        email: 'erika@example.com',
        phone: '+49 987 654321',
        company: 'Beispiel AG',
        status: 'active',
        createdAt: '2024-02-20',
      },
    ];

    setTimeout(() => {
      setCustomers(dummyData);
      setLoading(false);
    }, 500);
  }, []);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="customers-list-loading">Lädt...</div>;
  }

  return (
    <div className="customers-list">
      <div className="customers-list__header">
        <h1>Kunden</h1>
        <Link to="/customers/new" className="btn btn--primary">
          + Neuer Kunde
        </Link>
      </div>

      <div className="customers-list__search">
        <input
          type="search"
          placeholder="Kunden suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="customers-list__table-wrapper">
        <table className="customers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Telefon</th>
              <th>Firma</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-results">
                  Keine Kunden gefunden
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="customer-name">
                    <Link to={`/customers/${customer.id}`}>{customer.name}</Link>
                  </td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || '-'}</td>
                  <td>{customer.company || '-'}</td>
                  <td>
                    <span className={`status-badge status-badge--${customer.status}`}>
                      {customer.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="actions">
                    <Link to={`/customers/${customer.id}`} className="btn btn--small">
                      Ansehen
                    </Link>
                    <Link to={`/customers/${customer.id}/edit`} className="btn btn--small btn--secondary">
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
