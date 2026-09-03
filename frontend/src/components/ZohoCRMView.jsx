import { useState, useMemo } from 'react';
import './ZohoDataViews.css';

const ZohoCRMView = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract contacts from API response
  const contacts = useMemo(() => {
    if (!data?.records?.data) return [];
    return data.records.data;
  }, [data]);

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;

    return contacts.filter(contact => {
      const searchLower = searchTerm.toLowerCase();
      return (
        contact.Full_Name?.toLowerCase().includes(searchLower) ||
        contact.Email?.toLowerCase().includes(searchLower) ||
        contact.Account_Name?.Full_Name?.toLowerCase().includes(searchLower) ||
        contact.Phone?.toLowerCase().includes(searchLower)
      );
    });
  }, [contacts, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (contact) => {
    // If there's a Lead_Status or Contact_Status field
    const status = contact.Lead_Status || contact.Contact_Status || 'Active';
    const statusClass = status.toLowerCase().replace(/\s+/g, '-');
    return <span className={`status-badge status-${statusClass}`}>{status}</span>;
  };

  if (!contacts || contacts.length === 0) {
    return (
      <div className="no-data">
        <p>No CRM contacts found</p>
      </div>
    );
  }

  return (
    <div className="zoho-data-view">
      <div className="data-header">
        <div className="data-stats">
          <h3>CRM Contacts</h3>
          <span className="count-badge">{filteredContacts.length} contacts</span>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedContacts.map((contact, index) => (
              <tr key={contact.id || index}>
                <td>
                  <div className="contact-name">
                    <span className="name-avatar">
                      {contact.Full_Name?.charAt(0) || '?'}
                    </span>
                    {contact.Full_Name || 'N/A'}
                  </div>
                </td>
                <td>{contact.Email || '-'}</td>
                <td>{contact.Phone || '-'}</td>
                <td>{contact.Account_Name?.name || contact.Account_Name?.Full_Name || '-'}</td>
                <td>{getStatusBadge(contact)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ZohoCRMView;
