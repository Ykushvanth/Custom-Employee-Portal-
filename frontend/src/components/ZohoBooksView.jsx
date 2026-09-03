import { useState, useMemo } from 'react';
import './ZohoDataViews.css';

const ZohoBooksView = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract financial records from API response (contacts/customers)
  const records = useMemo(() => {
    if (!data?.records?.contacts) return [];
    return data.records.contacts;
  }, [data]);

  // Filter records based on search
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;

    const searchLower = searchTerm.toLowerCase();
    return records.filter(record =>
      record.contact_name?.toLowerCase().includes(searchLower) ||
      record.company_name?.toLowerCase().includes(searchLower) ||
      record.email?.toLowerCase().includes(searchLower)
    );
  }, [records, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (amount, currency = 'INR') => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': 'status-active',
      'inactive': 'status-inactive',
      'overdue': 'status-overdue'
    };
    const statusClass = statusMap[status?.toLowerCase()] || 'status-default';
    return <span className={`status-badge ${statusClass}`}>{status || 'Active'}</span>;
  };

  if (!records || records.length === 0) {
    return (
      <div className="no-data">
        <p>No financial records found</p>
      </div>
    );
  }

  return (
    <div className="zoho-data-view">
      <div className="data-header">
        <div className="data-stats">
          <h3>Customers & Contacts</h3>
          <span className="count-badge">{filteredRecords.length} records</span>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, company, or email..."
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
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.map((record, index) => (
              <tr key={record.contact_id || index}>
                <td>
                  <div className="contact-name">
                    <span className="name-avatar">
                      {record.contact_name?.charAt(0) || record.company_name?.charAt(0) || '?'}
                    </span>
                    {record.contact_name || 'N/A'}
                  </div>
                </td>
                <td>{record.company_name || '-'}</td>
                <td>{record.email || '-'}</td>
                <td>{record.phone || record.mobile || '-'}</td>
                <td className="amount-cell">
                  {formatCurrency(record.outstanding_receivable_amount, record.currency_code)}
                </td>
                <td>{getStatusBadge(record.status)}</td>
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

export default ZohoBooksView;
