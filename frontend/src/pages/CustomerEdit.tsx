import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './CustomerEdit.scss';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
  status: 'active' | 'inactive';
}

export default function CustomerEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
    notes: '',
    status: 'active',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // TODO: Fetch customer from API
    // Dummy data for now
    const dummyCustomer = {
      name: 'Max Mustermann',
      email: 'max@example.com',
      phone: '+49 123 456789',
      company: 'Musterfirma GmbH',
      address: 'Musterstraße 123',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Deutschland',
      notes: 'Wichtiger Kunde, bevorzugte Kommunikation per E-Mail.',
      status: 'active' as const,
    };

    setTimeout(() => {
      setFormData(dummyCustomer);
      setLoading(false);
    }, 500);
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Send to API
      console.log('Updating customer:', formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to detail page on success
      navigate(`/customers/${id}`);
    } catch (error) {
      console.error('Error updating customer:', error);
      // Handle error (show notification, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof CustomerFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (loading) {
    return (
      <div className="customer-edit-loading">
        <div className="spinner"></div>
        <p>Lädt Kundendaten...</p>
      </div>
    );
  }

  return (
    <div className="customer-edit">
      <div className="customer-edit__header">
        <div>
          <Link to={`/customers/${id}`} className="back-link">
            ← Zurück zu Kundendetails
          </Link>
          <h1>Kunde bearbeiten</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="customer-form">
        <div className="form-section">
          <h2>Grundinformationen</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">
                Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="Max Mustermann"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="company">Firma</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Musterfirma GmbH"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">
                E-Mail <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="max@example.com"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefon</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+49 123 456789"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>Adresse</h2>

          <div className="form-group">
            <label htmlFor="address">Straße und Hausnummer</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Musterstraße 123"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="postalCode">PLZ</label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="12345"
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">Stadt</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Berlin"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="country">Land</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Zusätzliche Informationen</h2>

          <div className="form-group">
            <label htmlFor="notes">Notizen</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Weitere Informationen zum Kunden..."
            />
          </div>
        </div>

        <div className="form-actions">
          <Link to={`/customers/${id}`} className="btn btn--secondary">
            Abbrechen
          </Link>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting ? 'Speichern...' : 'Änderungen speichern'}
          </button>
        </div>
      </form>
    </div>
  );
}
