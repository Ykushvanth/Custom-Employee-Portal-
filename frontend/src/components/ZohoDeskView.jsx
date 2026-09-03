import { useState, useMemo } from 'react';
import './ZohoDataViews.css';

const ZohoDeskView = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract tickets from API response
  const tickets = useMemo(() => {
    if (!data?.records?.data) return [];
    return data.records.data;
  }, [data]);

  // Filter tickets based on search and status
  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket =>
        ticket.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.subject?.toLowerCase().includes(searchLower) ||
        ticket.ticketNumber?.toLowerCase().includes(searchLower) ||
        ticket.email?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [tickets, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status) => {
    const statusMap = {
      'open': 'status-open',
      'pending': 'status-pending',
      'resolved': 'status-resolved',
      'closed': 'status-closed',
      'on hold': 'status-on-hold'
    };
    const statusClass = statusMap[status?.toLowerCase()] || 'status-default';
    return <span className={`status-badge ${statusClass}`}>{status || 'Unknown'}</span>;
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      'high': 'priority-high',
      'medium': 'priority-medium',
      'low': 'priority-low'
    };
    const priorityClass = priorityMap[priority?.toLowerCase()] || 'priority-default';
    return <span className={`priority-badge ${priorityClass}`}>{priority || 'N/A'}</span>;
  };

  if (!tickets || tickets.length === 0) {
    return (
      <div className="no-data">
        <p>No support tickets found</p>
      </div>
    );
  }

  const statusCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status?.toLowerCase() === 'open').length,
    pending: tickets.filter(t => t.status?.toLowerCase() === 'pending').length,
    resolved: tickets.filter(t => t.status?.toLowerCase() === 'resolved').length,
    closed: tickets.filter(t => t.status?.toLowerCase() === 'closed').length
  };

  return (
    <div className="zoho-data-view">
      <div className="data-header">
        <div className="data-stats">
          <h3>Support Tickets</h3>
          <span className="count-badge">{filteredTickets.length} tickets</span>
        </div>
        <div className="filters-group">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="all">All Status ({statusCounts.all})</option>
            <option value="open">Open ({statusCounts.open})</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="resolved">Resolved ({statusCounts.resolved})</option>
            <option value="closed">Closed ({statusCounts.closed})</option>
          </select>
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Contact</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.map((ticket, index) => (
              <tr key={ticket.id || index}>
                <td>
                  <span className="ticket-number">#{ticket.ticketNumber || ticket.id || 'N/A'}</span>
                </td>
                <td>
                  <div className="ticket-subject">
                    {ticket.subject || 'No Subject'}
                  </div>
                </td>
                <td>{getStatusBadge(ticket.status)}</td>
                <td>{getPriorityBadge(ticket.priority)}</td>
                <td>
                  {ticket.contactName || ticket.email || '-'}
                </td>
                <td>
                  {ticket.createdTime ? new Date(ticket.createdTime).toLocaleDateString() : '-'}
                </td>
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

export default ZohoDeskView;
