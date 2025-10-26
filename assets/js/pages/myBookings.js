import { showToast } from '../components/toast.js';
import { getAuthState } from '../utils/state.js';

export async function MyBookingsPage() {
  // Check authentication
  const authState = getAuthState();
  console.log('Auth state:', authState); // Debug log
  
  // Temporarily disable auth check for testing
  if (false && !authState.isLoggedIn) {
    console.log('User not logged in, redirecting to login...'); // Debug log
    // Redirect to login with return URL
    location.hash = '#/auth?return=' + encodeURIComponent('#/rooms');
    return '<div class="container"><p>Redirecting to login...</p></div>';
  }

  const userEmail = authState.user?.email || 'unknown';
  const userName = authState.user?.name || userEmail.split('@')[0];

  // Get user's bookings from localStorage
  const storageKey = `kina_bookings_${userEmail}`;
  const allBookings = JSON.parse(localStorage.getItem(storageKey) || '[]');
  console.log('Storage key:', storageKey); // Debug log
  console.log('All bookings:', allBookings); // Debug log
  
  // Separate current and past bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentBookings = allBookings.filter(booking => {
    const checkoutDate = new Date(booking.checkOut);
    checkoutDate.setHours(0, 0, 0, 0);
    return checkoutDate >= today && booking.status !== 'Cancelled';
  });
  
  const pastBookings = allBookings.filter(booking => {
    const checkoutDate = new Date(booking.checkOut);
    checkoutDate.setHours(0, 0, 0, 0);
    return checkoutDate < today || booking.status === 'Cancelled';
  });

  // Cancel booking function
  window.kinaCancelBooking = (bookingId) => {
    const updatedBookings = allBookings.map(booking => 
      booking.id === bookingId ? { ...booking, status: 'Cancelled' } : booking
    );
    localStorage.setItem(storageKey, JSON.stringify(updatedBookings));
    showToast('Booking cancelled successfully', 'success');
    // Refresh the page
    location.hash = '#/rooms';
  };

  // View booking details function
  window.kinaViewBookingDetails = (bookingId) => {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const detailsHTML = `
      <div class="booking-details-modal">
        <h3>Booking Details</h3>
        <div class="booking-details-content">
          <div class="detail-row">
            <strong>Booking ID:</strong> ${booking.id}
          </div>
          <div class="detail-row">
            <strong>Package:</strong> ${booking.packageName}
          </div>
          <div class="detail-row">
            <strong>Type:</strong> ${booking.packageType}
          </div>
          <div class="detail-row">
            <strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString()}
          </div>
          <div class="detail-row">
            <strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}
          </div>
          <div class="detail-row">
            <strong>Guests:</strong> ${booking.guests}
          </div>
          <div class="detail-row">
            <strong>Status:</strong> <span class="booking-status-badge ${booking.status.toLowerCase()}">${booking.status}</span>
          </div>
          <div class="detail-row">
            <strong>Booked on:</strong> ${new Date(booking.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn" onclick="document.querySelector('.modal').remove()">Close</button>
        </div>
      </div>
    `;
    
    // Use existing modal system
    if (window.openModal) {
      window.openModal(detailsHTML);
    }
  };

  // Generate table rows for bookings
  const generateBookingRows = (bookings, showActions = true) => {
    if (bookings.length === 0) {
      return `
        <tr>
          <td colspan="${showActions ? '8' : '7'}" class="empty-state">
            <div class="bookings-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M3 7v6h6"/>
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
              </svg>
              <p>${showActions ? 'No current bookings. Start planning your stay!' : 'No past bookings yet.'}</p>
            </div>
          </td>
        </tr>
      `;
    }

    return bookings.map(booking => `
      <tr>
        <td>${booking.id}</td>
        <td>${booking.packageName}</td>
        <td>${booking.packageType}</td>
        <td>${new Date(booking.checkIn).toLocaleDateString()}</td>
        <td>${new Date(booking.checkOut).toLocaleDateString()}</td>
        <td>${booking.guests}</td>
        <td><span class="booking-status-badge ${booking.status.toLowerCase()}">${booking.status}</span></td>
        ${showActions ? `
          <td class="booking-actions">
            <button class="btn small" onclick="kinaViewBookingDetails('${booking.id}')">View</button>
            ${booking.status === 'Confirmed' || booking.status === 'Pending' ? 
              `<button class="btn small danger" onclick="kinaCancelBooking('${booking.id}')">Cancel</button>` : ''
            }
          </td>
        ` : ''}
      </tr>
    `).join('');
  };

  return `
    <section class="container my-bookings-page">
      <div class="bookings-header">
        <h2>My Bookings</h2>
        <p class="user-welcome">Welcome back, ${userName}!</p>
        <div class="bookings-controls">
          <button class="btn primary" onclick="location.hash='#/packages'">Make a Booking</button>
        </div>
      </div>

      <!-- Current Bookings Section -->
      <div class="bookings-section">
        <h3>Current Bookings</h3>
        <div class="bookings-table-wrapper">
          <table class="bookings-table" aria-label="Current bookings">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Package Name</th>
                <th>Type</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${generateBookingRows(currentBookings, true)}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Past Bookings Section -->
      <div class="bookings-section">
        <h3>Past Bookings</h3>
        <div class="bookings-table-wrapper">
          <table class="bookings-table" aria-label="Past bookings">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Package Name</th>
                <th>Type</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${generateBookingRows(pastBookings, false)}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <style>
      .my-bookings-page {
        padding: 40px 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .bookings-header {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 2px solid var(--border);
      }

      .bookings-header h2 {
        margin: 0 0 8px 0;
        color: var(--color-text);
        font-size: 2.5rem;
        font-weight: 700;
      }

      .user-welcome {
        color: var(--color-text-secondary);
        margin: 0 0 20px 0;
        font-size: 1.1rem;
      }

      .bookings-controls {
        margin-top: 20px;
      }

      .bookings-section {
        margin-bottom: 40px;
      }

      .bookings-section h3 {
        color: var(--color-text);
        margin-bottom: 20px;
        font-size: 1.5rem;
        font-weight: 600;
        padding-left: 8px;
        border-left: 4px solid var(--color-accent);
      }

      .bookings-table-wrapper {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        overflow-x: auto;
      }

      .bookings-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 800px;
      }

      .bookings-table th {
        background: var(--color-accent);
        color: white;
        padding: 16px 12px;
        text-align: left;
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .bookings-table td {
        padding: 16px 12px;
        border-bottom: 1px solid var(--border);
        vertical-align: middle;
      }

      .bookings-table tr:hover {
        background: var(--color-bg);
      }

      .booking-status-badge {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .booking-status-badge.confirmed {
        background: #d4edda;
        color: #155724;
      }

      .booking-status-badge.pending {
        background: #fff3cd;
        color: #856404;
      }

      .booking-status-badge.cancelled {
        background: #f8d7da;
        color: #721c24;
      }

      .booking-status-badge.completed {
        background: #cce5ff;
        color: #004085;
      }

      .booking-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .btn.small {
        padding: 6px 12px;
        font-size: 0.8rem;
        border-radius: 6px;
      }

      .btn.danger {
        background: #dc3545;
        color: white;
        border: none;
      }

      .btn.danger:hover {
        background: #c82333;
      }

      .bookings-empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--color-text-secondary);
      }

      .bookings-empty-state svg {
        margin-bottom: 16px;
        opacity: 0.5;
      }

      .bookings-empty-state p {
        margin: 0;
        font-size: 1.1rem;
      }

      .empty-state {
        text-align: center;
      }

      /* Booking Details Modal Styles */
      .booking-details-modal h3 {
        margin-top: 0;
        color: var(--color-text);
        border-bottom: 2px solid var(--border);
        padding-bottom: 12px;
      }

      .booking-details-content {
        margin: 20px 0;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid var(--border);
      }

      .detail-row:last-child {
        border-bottom: none;
      }

      .modal-actions {
        text-align: right;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 2px solid var(--border);
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        .my-bookings-page {
          padding: 20px 10px;
        }

        .bookings-header h2 {
          font-size: 2rem;
        }

        .bookings-table {
          font-size: 0.9rem;
        }

        .bookings-table th,
        .bookings-table td {
          padding: 12px 8px;
        }

        .booking-actions {
          flex-direction: column;
        }

        .btn.small {
          width: 100%;
          text-align: center;
        }

        .detail-row {
          flex-direction: column;
          gap: 4px;
        }
      }
    </style>
  `;
}
