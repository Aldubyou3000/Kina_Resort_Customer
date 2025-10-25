// Calendar Modal Component for Package Availability and Date Selection
// No external libraries needed - using vanilla JavaScript

let currentModal = null;
let calendarState = {
  packageCategory: 'rooms',
  packageTitle: '',
  selectedCheckin: null,
  selectedCheckout: null,
  selectionStep: 1 // 1 = selecting check-in, 2 = selecting check-out
};

// Mock data for demonstration - in real app this would come from API
const mockReservationData = {
  'Standard Room': 15,
  'Ocean View Room': 12,
  'Deluxe Suite': 18,
  'Premium King': 20,
  'Beachfront Cottage': 8,
  'Garden View Cottage': 10,
  'Family Cottage': 14,
  'Grand Function Hall': 5,
  'Intimate Function Hall': 7
};

// Generate mock availability status for dates
function getMockDateStatus(date, packageTitle) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Past dates
  if (date < today) {
    return 'past';
  }
  
  // Today is always marked as "today"
  if (date.toDateString() === today.toDateString()) {
    return 'today';
  }
  
  // Create deterministic "random" based on date and package
  const dateString = date.toISOString().split('T')[0];
  const seed = dateString.split('-').join('') + packageTitle.length;
  const deterministicRandom = (parseInt(seed) % 100) / 100;
  
  const reservationCount = mockReservationData[packageTitle] || 10;
  
  // Higher chance of booked dates for packages with more reservations
  const bookedThreshold = 0.3 + (reservationCount / 100);
  
  if (deterministicRandom < 0.1) {
    return 'maintenance';
  } else if (deterministicRandom < bookedThreshold) {
    return 'booked';
  } else {
    return 'available';
  }
}

// Generate calendar HTML for a given month/year
function generateCalendarHTML(year, month, packageTitle) {
  const date = new Date(year, month, 1);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // Calculate max year (one year from current date)
  const maxYear = currentYear + 1;
  const maxMonth = currentMonth;
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = date.getDay();
  
  let calendarHTML = `
    <div class="calendar-header">
      <button class="calendar-nav-btn" onclick="navigateMonth(-1)" ${year <= currentYear && month <= currentMonth ? 'disabled' : ''}>
        <span>‹</span>
      </button>
      <div class="calendar-month-year">
        <select class="calendar-month-select" onchange="changeMonth(this.value)">
          ${generateMonthOptions(month)}
        </select>
        <select class="calendar-year-select" onchange="changeYear(this.value)">
          ${generateYearOptions(year, currentYear, maxYear)}
        </select>
      </div>
      <button class="calendar-nav-btn" onclick="navigateMonth(1)" ${year >= maxYear && month >= maxMonth ? 'disabled' : ''}>
        <span>›</span>
      </button>
    </div>
    <div class="calendar-selection-instruction">
      ${getSelectionInstruction()}
    </div>
    <div class="calendar-grid">
      <div class="calendar-day-header">Sun</div>
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
  `;
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarHTML += '<div class="calendar-date empty"></div>';
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const status = getMockDateStatus(currentDate, packageTitle);
    // Use local date formatting to avoid timezone issues
    const dateString = formatDateForInput(currentDate);
    
    // Determine additional classes for selection state
    let additionalClasses = '';
    
    // Normalize dates for comparison
    const normalizedCurrentDate = new Date(currentDate);
    normalizedCurrentDate.setHours(0, 0, 0, 0);
    
    if (calendarState.selectedCheckin) {
      const normalizedCheckin = new Date(calendarState.selectedCheckin);
      normalizedCheckin.setHours(0, 0, 0, 0);
      if (normalizedCurrentDate.getTime() === normalizedCheckin.getTime()) {
        additionalClasses += ' selected-checkin';
      }
    }
    
    if (calendarState.selectedCheckout) {
      const normalizedCheckout = new Date(calendarState.selectedCheckout);
      normalizedCheckout.setHours(0, 0, 0, 0);
      if (normalizedCurrentDate.getTime() === normalizedCheckout.getTime()) {
        additionalClasses += ' selected-checkout';
      }
    }
    
    // For cottage and function-hall single date selection
    if (calendarState.packageCategory === 'cottages' || calendarState.packageCategory === 'function-halls') {
      if (calendarState.selectedCheckin && !calendarState.selectedCheckout) {
        const normalizedCheckin = new Date(calendarState.selectedCheckin);
        normalizedCheckin.setHours(0, 0, 0, 0);
        if (normalizedCurrentDate.getTime() === normalizedCheckin.getTime()) {
          additionalClasses += ' selected-checkin';
        }
      }
    }
    
    if (isDateInRange(currentDate)) {
      additionalClasses += ' in-range';
    }
    
    calendarHTML += `
      <div class="calendar-date ${status}${additionalClasses}" 
           data-date="${dateString}" 
           data-status="${status}"
           onclick="handleDateClick('${dateString}', '${status}')">
        ${day}
      </div>
    `;
  }
  
  calendarHTML += '</div>';
  
  // Add reset button if dates are being selected
  if (calendarState.selectedCheckin || calendarState.selectedCheckout) {
    calendarHTML += `
      <div class="calendar-actions">
        <button class="calendar-reset-btn" onclick="resetDateSelection()">Reset Selection</button>
      </div>
    `;
  }
  
  return calendarHTML;
}

// Get selection instruction based on package type and current state
function getSelectionInstruction() {
  if (calendarState.packageCategory === 'rooms') {
    if (calendarState.selectionStep === 1) {
      return 'Click a date to select check-in date';
    } else {
      return 'Click a date after ' + calendarState.selectedCheckin.toLocaleDateString() + ' to select check-out date';
    }
  } else {
    return 'Click a date to select your preferred date';
  }
}

// Check if date is in selected range
function isDateInRange(date) {
  if (!calendarState.selectedCheckin || !calendarState.selectedCheckout) {
    return false;
  }
  
  // Normalize dates to compare only date parts (ignore time)
  const checkinDate = new Date(calendarState.selectedCheckin);
  checkinDate.setHours(0, 0, 0, 0);
  const checkoutDate = new Date(calendarState.selectedCheckout);
  checkoutDate.setHours(0, 0, 0, 0);
  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0);
  
  // Don't highlight the check-in and check-out dates themselves (they have their own styling)
  return currentDate > checkinDate && currentDate < checkoutDate;
}

// Handle date click
function handleDateClick(dateString, status) {
  // Don't allow clicking on past dates or maintenance
  if (status === 'past' || status === 'maintenance') {
    return;
  }
  
  const clickedDate = new Date(dateString);
  clickedDate.setHours(0, 0, 0, 0); // Normalize to start of day
  
  if (calendarState.packageCategory === 'rooms') {
    if (calendarState.selectionStep === 1) {
      // First click - select check-in
      calendarState.selectedCheckin = new Date(clickedDate);
      calendarState.selectionStep = 2;
      updateCalendarDisplay();
    } else {
      // Second click - select check-out
      if (clickedDate > calendarState.selectedCheckin) {
        calendarState.selectedCheckout = new Date(clickedDate);
        updateCalendarDisplay();
        // Show confirmation after a brief delay to show the selection
        setTimeout(() => {
          if (confirm(`Confirm your stay from ${calendarState.selectedCheckin.toLocaleDateString()} to ${calendarState.selectedCheckout.toLocaleDateString()}?`)) {
            openBookingWithDates();
          } else {
            resetDateSelection();
          }
        }, 100);
      } else {
        alert('Check-out date must be after check-in date');
      }
    }
  } else {
    // Cottage or function hall - single date selection
    calendarState.selectedCheckin = new Date(clickedDate);
    updateCalendarDisplay();
    // Show confirmation after a brief delay to show the selection
    setTimeout(() => {
      const packageType = calendarState.packageCategory === 'cottages' ? 'cottage' : 'function hall';
      if (confirm(`Confirm your ${packageType} booking for ${calendarState.selectedCheckin.toLocaleDateString()}?`)) {
        openBookingWithDates();
      } else {
        resetDateSelection();
      }
    }, 100);
  }
}

// Reset date selection
function resetDateSelection() {
  calendarState.selectedCheckin = null;
  calendarState.selectedCheckout = null;
  calendarState.selectionStep = 1;
  updateCalendarDisplay();
}

// Update calendar display
function updateCalendarDisplay(year = null, month = null) {
  const calendarContainer = document.querySelector('.calendar-container');
  if (calendarContainer) {
    const today = new Date();
    
    // If no year/month provided, try to get current calendar view
    if (year === null || month === null) {
      const monthSelect = document.querySelector('.calendar-month-select');
      const yearSelect = document.querySelector('.calendar-year-select');
      
      if (monthSelect && yearSelect) {
        // Use current calendar view
        year = parseInt(yearSelect.value);
        month = parseInt(monthSelect.value);
      } else {
        // Fallback to current date
        year = today.getFullYear();
        month = today.getMonth();
      }
    }
    
    calendarContainer.innerHTML = generateCalendarHTML(year, month, calendarState.packageTitle);
  }
}

// Open booking modal with selected dates
function openBookingWithDates() {
  let reservationType = 'room';
  let preFillDates = {};
  
  if (calendarState.packageCategory === 'rooms') {
    reservationType = 'room';
    // Format dates as YYYY-MM-DD without timezone issues
    const checkinDate = new Date(calendarState.selectedCheckin);
    const checkoutDate = new Date(calendarState.selectedCheckout);
    
    preFillDates = {
      checkin: formatDateForInput(checkinDate),
      checkout: formatDateForInput(checkoutDate)
    };
  } else if (calendarState.packageCategory === 'cottages') {
    reservationType = 'cottage';
    const selectedDate = new Date(calendarState.selectedCheckin);
    preFillDates = {
      date: formatDateForInput(selectedDate)
    };
  } else if (calendarState.packageCategory === 'function-halls') {
    reservationType = 'function-hall';
    const selectedDate = new Date(calendarState.selectedCheckin);
    preFillDates = {
      date: formatDateForInput(selectedDate)
    };
  }
  
  // Close calendar modal
  closeCalendarModal();
  
  // Open booking modal with pre-filled dates
  if (window.openBookingModal) {
    window.openBookingModal(reservationType, calendarState.packageTitle, preFillDates);
  }
}

// Create and show the calendar modal
export function openCalendarModal(packageTitle, reservationCount, packageCategory = 'rooms') {
  // Close any existing modal
  closeCalendarModal();
  
  // Initialize calendar state
  calendarState.packageCategory = packageCategory;
  calendarState.packageTitle = packageTitle;
  calendarState.selectedCheckin = null;
  calendarState.selectedCheckout = null;
  calendarState.selectionStep = 1;
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  const modalHTML = `
    <div class="calendar-modal-overlay" id="calendar-modal-overlay">
      <div class="calendar-modal">
        <button class="calendar-modal-close" onclick="closeCalendarModal()" aria-label="Close calendar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div class="calendar-modal-header">
          <h3>Select Your Dates</h3>
          <p class="calendar-package-title">${packageTitle}</p>
          <p class="calendar-reservation-count">${reservationCount} total reservations</p>
        </div>
        
        <div class="calendar-container">
          ${generateCalendarHTML(currentYear, currentMonth, packageTitle)}
        </div>
        
        <div class="calendar-legend">
          <div class="legend-item">
            <div class="legend-color available"></div>
            <span>Available</span>
          </div>
          <div class="legend-item">
            <div class="legend-color today"></div>
            <span>Today</span>
          </div>
          <div class="legend-item">
            <div class="legend-color booked"></div>
            <span>Booked</span>
          </div>
          <div class="legend-item">
            <div class="legend-color maintenance"></div>
            <span>Maintenance</span>
          </div>
          <div class="legend-item">
            <div class="legend-color past"></div>
            <span>Past Dates</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  currentModal = document.getElementById('calendar-modal-overlay');
  
  // Prevent background scrolling
  document.body.style.overflow = 'hidden';
  document.body.classList.add('modal-open');
  
  // Add click outside to close
  currentModal.addEventListener('click', (e) => {
    if (e.target === currentModal) {
      closeCalendarModal();
    }
  });
  
  // Add escape key to close
  document.addEventListener('keydown', handleEscapeKey);
  
  // Animate modal in
  setTimeout(() => {
    currentModal.classList.add('show');
  }, 10);
}

// Close the calendar modal
export function closeCalendarModal() {
  if (currentModal) {
    currentModal.classList.remove('show');
    
    // Restore background scrolling
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    
    setTimeout(() => {
      if (currentModal && currentModal.parentNode) {
        currentModal.parentNode.removeChild(currentModal);
      }
      currentModal = null;
    }, 300);
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleEscapeKey);
  }
}

// Handle escape key press
function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeCalendarModal();
  }
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate month options for select dropdown
function generateMonthOptions(selectedMonth) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return monthNames.map((month, index) => 
    `<option value="${index}" ${index === selectedMonth ? 'selected' : ''}>${month}</option>`
  ).join('');
}

// Generate year options for select dropdown
function generateYearOptions(selectedYear, minYear, maxYear) {
  let options = '';
  for (let year = minYear; year <= maxYear; year++) {
    options += `<option value="${year}" ${year === selectedYear ? 'selected' : ''}>${year}</option>`;
  }
  return options;
}

// Navigate to previous/next month
function navigateMonth(direction) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // Get current calendar state
  const calendarContainer = document.querySelector('.calendar-container');
  if (!calendarContainer) return;
  
  // Extract current year and month from the selects
  const monthSelect = document.querySelector('.calendar-month-select');
  const yearSelect = document.querySelector('.calendar-year-select');
  
  if (!monthSelect || !yearSelect) return;
  
  let newMonth = parseInt(monthSelect.value) + direction;
  let newYear = parseInt(yearSelect.value);
  
  // Handle month overflow
  if (newMonth < 0) {
    newMonth = 11;
    newYear--;
  } else if (newMonth > 11) {
    newMonth = 0;
    newYear++;
  }
  
  // Check bounds (one year limit)
  const maxYear = currentYear + 1;
  const maxMonth = currentMonth;
  
  if (newYear < currentYear || (newYear === currentYear && newMonth < currentMonth)) {
    return; // Can't go before current month
  }
  
  if (newYear > maxYear || (newYear === maxYear && newMonth > maxMonth)) {
    return; // Can't go beyond one year
  }
  
  updateCalendarDisplay(newYear, newMonth);
}

// Change month via select dropdown
function changeMonth(monthValue) {
  const yearSelect = document.querySelector('.calendar-year-select');
  if (!yearSelect) return;
  
  const newYear = parseInt(yearSelect.value);
  const newMonth = parseInt(monthValue);
  
  updateCalendarDisplay(newYear, newMonth);
}

// Change year via select dropdown
function changeYear(yearValue) {
  const monthSelect = document.querySelector('.calendar-month-select');
  if (!monthSelect) return;
  
  const newYear = parseInt(yearValue);
  const newMonth = parseInt(monthSelect.value);
  
  updateCalendarDisplay(newYear, newMonth);
}

// Make functions globally available for onclick handlers
window.closeCalendarModal = closeCalendarModal;
window.openCalendarModal = openCalendarModal;
window.handleDateClick = handleDateClick;
window.resetDateSelection = resetDateSelection;
window.navigateMonth = navigateMonth;
window.changeMonth = changeMonth;
window.changeYear = changeYear;
