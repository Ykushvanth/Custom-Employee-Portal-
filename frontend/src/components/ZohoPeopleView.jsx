import { useState, useMemo } from 'react';
import './ZohoDataViews.css';

const ZohoPeopleView = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Extract employees from API response
  const employees = useMemo(() => {
    if (!data?.records?.data) return [];
    return data.records.data;
  }, [data]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(employees.map(emp => emp.Department || emp.department || 'Unknown'));
    return ['all', ...Array.from(depts)];
  }, [employees]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp =>
        (emp.Department || emp.department || 'Unknown') === departmentFilter
      );
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.Full_Name?.toLowerCase().includes(searchLower) ||
        emp.Email?.toLowerCase().includes(searchLower) ||
        emp.Department?.toLowerCase().includes(searchLower) ||
        emp.Employee_ID?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [employees, searchTerm, departmentFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': 'status-active',
      'inactive': 'status-inactive',
      'on leave': 'status-on-leave'
    };
    const statusClass = statusMap[status?.toLowerCase()] || 'status-active';
    return <span className={`status-badge ${statusClass}`}>{status || 'Active'}</span>;
  };

  if (!employees || employees.length === 0) {
    return (
      <div className="no-data">
        <p>No employee records found</p>
      </div>
    );
  }

  return (
    <div className="zoho-data-view">
      <div className="data-header">
        <div className="data-stats">
          <h3>Employees</h3>
          <span className="count-badge">{filteredEmployees.length} employees</span>
        </div>
        <div className="filters-group">
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === 'all' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search employees..."
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
              <th>Employee</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.map((emp, index) => (
              <tr key={emp.id || emp.Employee_ID || index}>
                <td>
                  <div className="contact-name">
                    <span className="name-avatar">
                      {emp.Full_Name?.charAt(0) || emp.Name?.charAt(0) || '?'}
                    </span>
                    <div>
                      <div>{emp.Full_Name || emp.Name || 'N/A'}</div>
                      {emp.Employee_ID && (
                        <div className="employee-id">ID: {emp.Employee_ID}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td>{emp.Email || emp.email || '-'}</td>
                <td>{emp.Department || emp.department || '-'}</td>
                <td>{emp.Designation || emp.Role || emp.role || '-'}</td>
                <td>{getStatusBadge(emp.Status || emp.status)}</td>
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

export default ZohoPeopleView;
