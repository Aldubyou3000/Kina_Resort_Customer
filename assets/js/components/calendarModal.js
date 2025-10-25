// Calendar Modal Component for Package Availability and Date Selection
// No external libraries needed - using vanilla JavaScript

let currentModal = null;
let calendarState = {
  packageCategory: 'rooms',
  packageTitle: '',
  selectedCheckin: null,
  selectedCheckout: null,
  selectionStep: 1, // 1 = selecting check-in, 2 = selecting check-out
  modifyingDate: null, // 'checkin', 'checkout', or null for normal flow
  undoStack: [] // Stack to track previous states for undo functionality
};

// Mock data for demonstration - in real app this would come from API
// Availability patterns:
// - Weekdays: Mostly available (good for testing)
// - Weekends: Mostly booked (realistic demand)
// - Holidays: Booked periods (Christmas week, summer peak)
// - Maintenance: Random 5% of dates
// - Most other dates: Available for testing
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
  
  // Specific unavailable dates for realistic testing scenarios
  const unavailableDates = [
    // Weekend bookings (Fridays and Saturdays)
    (date) => {
      const dayOfWeek = date.getDay();
      return dayOfWeek === 5 || dayOfWeek === 6; // Friday = 5, Saturday = 6
    },
    // Holiday periods (example: Christmas week)
    (date) => {
      const month = date.getMonth();
      const day = date.getDate();
      return month === 11 && day >= 20 && day <= 27; // Dec 20-27
    },
    // Summer peak season (example: July 15-31)
    (date) => {
      const month = date.getMonth();
      const day = date.getDate();
      return month === 6 && day >= 15; // July 15-31
    },
    // Random maintenance days (1-2 days per month)
    (date) => {
      const dateString = date.toISOString().split('T')[0];
      const seed = dateString.split('-').join('') + packageTitle.length;
      const deterministicRandom = (parseInt(seed) % 100) / 100;
      return deterministicRandom < 0.05; // 5% chance for maintenance
    }
  ];
  
  // Check if date matches any unavailable pattern
  for (const checkUnavailable of unavailableDates) {
    if (checkUnavailable(date)) {
      // Determine if it's maintenance or booked
      const dateString = date.toISOString().split('T')[0];
      const seed = dateString.split('-').join('') + packageTitle.length;
      const deterministicRandom = (parseInt(seed) % 100) / 100;
      
      if (deterministicRandom < 0.3) {
        return 'maintenance';
      } else {
        return 'booked';
      }
    }
  }
  
  // Most other dates are available for testing
  return 'available';
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
  
  // Add action buttons
  const hasUndoActions = calendarState.undoStack.length > 0;
  const hasBothDates = calendarState.selectedCheckin && calendarState.selectedCheckout;
  const isModifyingSingleDate = calendarState.modifyingDate && (calendarState.selectedCheckin || calendarState.selectedCheckout);
  
  if (hasUndoActions || hasBothDates || isModifyingSingleDate) {
    calendarHTML += `
      <div class="calendar-actions">
        ${hasUndoActions ? 
          `<button class="calendar-undo-btn" onclick="undoLastSelection()" title="Undo last selection">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7v6h6"/>
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
            Undo
          </button>` : ''
        }
        ${(hasBothDates || isModifyingSingleDate) ? 
          `<button class="calendar-confirm-btn" onclick="confirmDateSelection()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            Confirm Selection
          </button>` : ''
        }
      </div>
    `;
  }
  
  return calendarHTML;
}

// Get selection instruction based on package type and current state
function getSelectionInstruction() {
  // Check if we're modifying a specific date from booking modal
  if (calendarState.modifyingDate) {
    if (calendarState.modifyingDate === 'checkin') {
      return 'Click a date to select your check-in date';
    } else if (calendarState.modifyingDate === 'checkout') {
      return 'Click a date after check-in to select your check-out date';
    }
  }
  
  // Normal flow for standalone calendar
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
  
  // Save current state before making changes (for undo functionality)
  saveStateForUndo();
  
  // Check if we're modifying a specific date from booking modal
  if (calendarState.modifyingDate) {
    if (calendarState.modifyingDate === 'checkin') {
      calendarState.selectedCheckin = new Date(clickedDate);
      // If checkout exists and is before new checkin, clear it
      if (calendarState.selectedCheckout && clickedDate >= calendarState.selectedCheckout) {
        calendarState.selectedCheckout = null;
      }
    } else if (calendarState.modifyingDate === 'checkout') {
      // Check if checkout is after checkin
      if (calendarState.selectedCheckin && clickedDate <= calendarState.selectedCheckin) {
        alert('Check-out date must be after check-in date');
        return;
      }
      calendarState.selectedCheckout = new Date(clickedDate);
    }
    
    updateCalendarDisplay();
    
    // Don't auto-close - let user confirm with button
    return;
  }
  
  // Normal flow for standalone calendar
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
        // No automatic confirmation - user will click Confirm button when ready
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

// Save current state to undo stack
function saveStateForUndo() {
  const stateSnapshot = {
    selectedCheckin: calendarState.selectedCheckin ? new Date(calendarState.selectedCheckin) : null,
    selectedCheckout: calendarState.selectedCheckout ? new Date(calendarState.selectedCheckout) : null,
    selectionStep: calendarState.selectionStep,
    modifyingDate: calendarState.modifyingDate
  };
  
  // Only save if state actually changed
  const lastState = calendarState.undoStack[calendarState.undoStack.length - 1];
  if (!lastState || 
      lastState.selectedCheckin?.getTime() !== stateSnapshot.selectedCheckin?.getTime() ||
      lastState.selectedCheckout?.getTime() !== stateSnapshot.selectedCheckout?.getTime() ||
      lastState.selectionStep !== stateSnapshot.selectionStep ||
      lastState.modifyingDate !== stateSnapshot.modifyingDate) {
    calendarState.undoStack.push(stateSnapshot);
    
    // Limit undo stack to prevent memory issues
    if (calendarState.undoStack.length > 10) {
      calendarState.undoStack.shift();
    }
  }
}

// Undo last date selection
function undoLastSelection() {
  if (calendarState.undoStack.length === 0) {
    return; // Nothing to undo
  }
  
  const previousState = calendarState.undoStack.pop();
  
  calendarState.selectedCheckin = previousState.selectedCheckin;
  calendarState.selectedCheckout = previousState.selectedCheckout;
  calendarState.selectionStep = previousState.selectionStep;
  calendarState.modifyingDate = previousState.modifyingDate;
  
  updateCalendarDisplay();
}

// Confirm date selection and proceed with booking
function confirmDateSelection() {
  if (!calendarState.selectedCheckin || !calendarState.selectedCheckout) {
    return; // Safety check
  }
  
  // If we're modifying dates from booking modal, update the booking modal directly
  if (calendarState.modifyingDate) {
    openBookingWithDates();
  } else {
    // Normal flow - proceed with booking
    openBookingWithDates();
  }
}

// Reset date selection
function resetDateSelection() {
  calendarState.selectedCheckin = null;
  calendarState.selectedCheckout = null;
  calendarState.selectionStep = 1;
  calendarState.modifyingDate = null;
  calendarState.undoStack = []; // Clear undo stack on reset
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
  
  // Check if we're coming from booking modal
  if (window.bookingModalCalendarMode) {
    // Update the booking modal dates directly
    if (window.updateBookingDates && preFillDates.checkin && preFillDates.checkout) {
      window.updateBookingDates(preFillDates.checkin, preFillDates.checkout);
    }
    // Clear the calendar mode
    window.bookingModalCalendarMode = null;
    window.bookingModalCurrentDates = null;
  } else {
    // Open booking modal with pre-filled dates
    if (window.openBookingModal) {
      window.openBookingModal(reservationType, calendarState.packageTitle, preFillDates);
    }
  }
}

// Create and show the calendar modal
export function openCalendarModal(packageTitle, reservationCount, packageCategory = 'rooms') {
  // Close any existing modal
  closeCalendarModal();
  
  // Initialize calendar state
  calendarState.packageCategory = packageCategory;
  calendarState.packageTitle = packageTitle;
  
  // Check if we're coming from booking modal with existing dates
  if (window.bookingModalCalendarMode && window.bookingModalCurrentDates) {
    // Set which date we're modifying
    calendarState.modifyingDate = window.bookingModalCalendarMode;
    
    // Only pre-populate if dates are actually selected (not null or empty)
    const hasCheckin = window.bookingModalCurrentDates.checkin !== null && window.bookingModalCurrentDates.checkin !== '';
    const hasCheckout = window.bookingModalCurrentDates.checkout !== null && window.bookingModalCurrentDates.checkout !== '';
    
    if (hasCheckin) {
      calendarState.selectedCheckin = new Date(window.bookingModalCurrentDates.checkin);
    }
    if (hasCheckout) {
      calendarState.selectedCheckout = new Date(window.bookingModalCurrentDates.checkout);
    }
    
    // Set selection step based on what dates are available
    if (hasCheckin && hasCheckout) {
      calendarState.selectionStep = 2; // Both dates selected
    } else if (hasCheckin) {
      calendarState.selectionStep = 2; // Check-in selected, ready for check-out
    } else {
      calendarState.selectionStep = 1; // Start fresh
    }
  } else {
    calendarState.selectedCheckin = null;
    calendarState.selectedCheckout = null;
    calendarState.selectionStep = 1;
    calendarState.modifyingDate = null;
  }
  
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
  
  // Disable Lenis smooth scrolling when modal is open
  const lenisInstance = window.lenisInstance || document.querySelector('.lenis')?.lenis;
  if (lenisInstance) {
    lenisInstance.stop();
  }
  
  // Add click outside to close
  currentModal.addEventListener('click', (e) => {
    if (e.target === currentModal) {
      closeCalendarModal();
    }
  });
  
  // Prevent scroll events from bubbling to background
  currentModal.addEventListener('wheel', (e) => {
    e.stopPropagation();
  }, { passive: false });
  
  // Prevent middle mouse scroll from affecting background
  currentModal.addEventListener('mousedown', (e) => {
    if (e.button === 1) { // Middle mouse button
      e.preventDefault();
    }
  });
  
  // Additional scroll prevention for the modal content
  const modalContent = currentModal.querySelector('.calendar-modal');
  if (modalContent) {
    modalContent.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: false });
    
    modalContent.addEventListener('mousedown', (e) => {
      if (e.button === 1) { // Middle mouse button
        e.preventDefault();
      }
    });
  }
  
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
    
    // Re-enable Lenis smooth scrolling when modal is closed
    const lenisInstance = window.lenisInstance || document.querySelector('.lenis')?.lenis;
    if (lenisInstance) {
      lenisInstance.start();
    }
    
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
window.undoLastSelection = undoLastSelection;
window.confirmDateSelection = confirmDateSelection;
window.navigateMonth = navigateMonth;
window.changeMonth = changeMonth;
window.changeYear = changeYear;
