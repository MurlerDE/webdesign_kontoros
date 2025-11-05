import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import CustomersList from './pages/CustomersList';
import CustomerNew from './pages/CustomerNew';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerEdit from './pages/CustomerEdit';
import ContactsManagement from './components/contacts/ContactsManagement';
import './App.scss';

function HomePage() {
  return (
    <div className="home-page">
      <h1>Kontoros - Kundenverwaltung</h1>
      <p>Willkommen bei Kontoros, Ihrer Lösung für Kunden- und Kontaktverwaltung.</p>
      <div className="home-links">
        <Link to="/customers" className="home-card">
          <h2>👥 Kunden</h2>
          <p>Verwalten Sie Ihre Kundendatenbank</p>
        </Link>
        <Link to="/contacts" className="home-card">
          <h2>📇 Kontakte</h2>
          <p>Verwalten Sie Ihre Kontakte</p>
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="app-nav">
          <div className="nav-container">
            <Link to="/" className="nav-brand">
              Kontoros
            </Link>
            <div className="nav-links">
              <Link to="/customers" className="nav-link">
                Kunden
              </Link>
              <Link to="/contacts" className="nav-link">
                Kontakte
              </Link>
            </div>
          </div>
        </nav>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/customers" element={<CustomersList />} />
            <Route path="/customers/new" element={<CustomerNew />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/customers/:id/edit" element={<CustomerEdit />} />
            <Route path="/contacts" element={<ContactsManagement />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
