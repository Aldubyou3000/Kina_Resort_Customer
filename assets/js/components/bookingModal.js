// Comprehensive Booking Modal Component
// Handles Room, Cottage, and Function Hall reservations

let currentBookingModal = null;
let bookingFormState = {
  reservationType: 'room',
  addCottageToRoom: false,
  addRoomToCottage: false,
  formData: {},
  errors: {}
};

// Room types for selection
const roomTypes = ['Room A1', 'Room A2', 'Room A3', 'Room A4'];
const cottageTypes = ['Beachfront Cottage', 'Garden View Cottage', 'Family Cottage'];
const functionHallTypes = ['Grand Function Hall', 'Intimate Function Hall'];

// Mock reservation data for consistent availability
const mockReservationData = {
  'Room A1': 8,
  'Room A2': 12,
  'Room A3': 6,
  'Room A4': 15,
  'Grand Function Hall': 5,
  'Intimate Function Hall': 7
};

// Mock booking database for availability checking
const mockBookings = {
  'Room A1': [],
  'Room A2': [],
  'Room A3': [],
  'Room A4': []
};

// Check if room is available for given dates
function isRoomAvailable(roomId, checkinDate, checkoutDate) {
  // Use deterministic mock system consistent with calendar
  let currentDate = new Date(checkinDate);
  const endDate = new Date(checkoutDate);
  
  while (currentDate < endDate) {
    const status = getMockDateStatus(currentDate, roomId);
    if (status === 'booked' || status === 'maintenance') {
      return false;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return true;
}

// Deterministic mock date status (same as calendar modal)
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


// Open booking modal with optional pre-selection and pre-filled dates
export function openBookingModal(initialType = 'room', packageTitle = '', preFillDates = null) {
  closeBookingModal();
  
  bookingFormState.reservationType = initialType;
  bookingFormState.addCottageToRoom = false;
  bookingFormState.addRoomToCottage = false;
  bookingFormState.formData = {};
  bookingFormState.errors = {};
  bookingFormState.preFillDates = preFillDates;
  
  const modalHTML = `
    <div class="booking-modal-overlay" id="booking-modal-overlay">
      <div class="booking-modal">
        <button class="booking-modal-close" onclick="closeBookingModal()" aria-label="Close booking modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div class="booking-modal-header">
          <h2>Make a Reservation</h2>
          <p class="booking-subtitle">Complete your booking details below</p>
          
          <div class="reservation-type-selector">
            <button class="type-tab ${initialType === 'room' ? 'active' : ''}" data-type="room" onclick="changeReservationType('room')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9,22 9,12 15,12 15,22"></polyline>
              </svg>
              Room Stay
            </button>
            <button class="type-tab ${initialType === 'cottage' ? 'active' : ''}" data-type="cottage" onclick="changeReservationType('cottage')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              Cottage
            </button>
            <button class="type-tab ${initialType === 'function-hall' ? 'active' : ''}" data-type="function-hall" onclick="changeReservationType('function-hall')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              Function Hall
            </button>
          </div>
        </div>
        
        <form class="booking-form" id="booking-form" onsubmit="submitBooking(event)">
          <div class="booking-form-content">
            ${renderFormFields(initialType)}
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  currentBookingModal = document.getElementById('booking-modal-overlay');
  
  // Prevent background scrolling
  document.body.style.overflow = 'hidden';
  document.body.classList.add('modal-open');
  
  // Add event listeners
  currentBookingModal.addEventListener('click', (e) => {
    if (e.target === currentBookingModal) {
      closeBookingModal();
    }
  });
  
  // Prevent scroll events from bubbling to background
  currentBookingModal.addEventListener('wheel', (e) => {
    e.stopPropagation();
  }, { passive: false });
  
  document.addEventListener('keydown', handleEscapeKey);
  
  // Initialize form
  initializeForm();
  
  // Animate modal in
  setTimeout(() => {
    currentBookingModal.classList.add('show');
  }, 10);
}

// Close booking modal
export function closeBookingModal() {
  if (currentBookingModal) {
    currentBookingModal.classList.remove('show');
    
    // Restore background scrolling
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    
    setTimeout(() => {
      if (currentBookingModal && currentBookingModal.parentNode) {
        currentBookingModal.parentNode.removeChild(currentBookingModal);
      }
      currentBookingModal = null;
    }, 300);
    
    document.removeEventListener('keydown', handleEscapeKey);
  }
}

// Change reservation type
function changeReservationType(type) {
  bookingFormState.reservationType = type;
  bookingFormState.addCottageToRoom = false;
  bookingFormState.addRoomToCottage = false;
  
  // Update active tab
  document.querySelectorAll('.type-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-type="${type}"]`).classList.add('active');
  
  // Re-render form
  const formContent = document.querySelector('.booking-form-content');
  formContent.innerHTML = renderFormFields(type);
  
  // Re-initialize form
  initializeForm();
}

// Render form fields based on reservation type
function renderFormFields(type) {
  const baseFields = `
    <div class="form-section">
      <h3>Guest Information</h3>
      <div class="form-field">
        <label for="guest-name" class="form-label">Guest Name *</label>
        <input type="text" id="guest-name" name="guestName" class="form-input" required>
        <div class="form-error" id="guest-name-error"></div>
      </div>
      
      <div class="form-field">
        <label for="email" class="form-label">Email Address *</label>
        <input type="email" id="email" name="email" class="form-input" required>
        <div class="form-error" id="email-error"></div>
      </div>
      
      <div class="form-field">
        <label for="contact" class="form-label">Contact Number *</label>
        <input type="tel" id="contact" name="contact" class="form-input" required>
        <div class="form-error" id="contact-error"></div>
      </div>
    </div>
  `;
  
  if (type === 'room') {
    return baseFields + renderRoomFields();
  } else if (type === 'cottage') {
    return baseFields + renderCottageFields();
  } else if (type === 'function-hall') {
    return baseFields + renderFunctionHallFields();
  }
}

// Render room booking fields
function renderRoomFields() {
  return `
    <div class="form-section">
      <h3>Room Details</h3>
      
      <div class="date-time-group">
        <div class="form-field">
          <label for="checkin-date" class="form-label">Check-in Date *</label>
          <input type="date" id="checkin-date" name="checkinDate" class="form-input" required>
          <div class="form-error" id="checkin-date-error"></div>
        </div>
        
        <div class="form-field">
          <label for="checkout-date" class="form-label">Check-out Date *</label>
          <input type="date" id="checkout-date" name="checkoutDate" class="form-input" required>
          <div class="form-error" id="checkout-date-error"></div>
        </div>
      </div>
      
      <div class="form-field auto-calculated-field">
        <label class="form-label">Number of Nights</label>
        <div class="calculated-value" id="nights-display">0</div>
      </div>
      
      <div class="guests-group">
        <div class="form-field">
          <label for="adults" class="form-label">Number of Adults *</label>
          <input type="number" id="adults" name="adults" class="form-input" min="1" value="1" required>
          <div class="form-error" id="adults-error"></div>
        </div>
        
        <div class="form-field">
          <label for="children" class="form-label">Number of Children</label>
          <input type="number" id="children" name="children" class="form-input" min="0" value="0">
        </div>
      </div>
      
      <div class="form-field">
        <label for="num-rooms" class="form-label">Number of Rooms *</label>
        <select id="num-rooms" name="numRooms" class="form-select" required>
          <option value="1">1 Room</option>
          <option value="2">2 Rooms</option>
          <option value="3">3 Rooms</option>
        </select>
        <div class="form-error" id="num-rooms-error"></div>
      </div>
      
      <div class="form-field" id="room-selection-field">
        <label class="form-label">Room Selection *</label>
        <div class="checkbox-group" id="room-checkboxes">
          ${generateRoomCheckboxes()}
        </div>
        <div class="form-error" id="room-selection-error"></div>
      </div>
      
      <div class="add-option-section">
        <button type="button" class="add-option-toggle" onclick="toggleAddCottage()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Cottage to Room Booking
        </button>
        
        <div class="form-field" id="cottage-selection-field" style="display: none;">
          <label class="form-label">Cottage Selection</label>
          <div class="checkbox-group">
            ${cottageTypes.map(cottage => `
              <label class="checkbox-item">
                <input type="checkbox" name="selectedCottages" value="${cottage}">
                <span class="checkbox-label">${cottage}</span>
              </label>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
    
    ${renderPaymentAndAgreement()}
  `;
}

// Render cottage booking fields
function renderCottageFields() {
  return `
    <div class="form-section">
      <h3>Cottage Details</h3>
      
      <div class="form-field">
        <label for="cottage-date" class="form-label">Date *</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="date" id="cottage-date" name="cottageDate" class="form-input" required style="flex: 1;">
          <button type="button" class="calendar-icon-btn" onclick="openCalendarModal('cottages', 'Cottage Booking')" title="Select from calendar">
            📅
          </button>
        </div>
        <div class="form-error" id="cottage-date-error"></div>
      </div>
      
      <div class="form-field">
        <label class="form-label">Time Range *</label>
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="flex: 1;">
            <label for="start-time" class="form-label" style="font-size: 0.9em; margin-bottom: 4px;">Start Time</label>
            <input type="time" id="start-time" name="startTime" class="form-input" required>
            <div class="form-error" id="start-time-error"></div>
          </div>
          <div style="flex: 1;">
            <label for="end-time" class="form-label" style="font-size: 0.9em; margin-bottom: 4px;">End Time</label>
            <input type="time" id="end-time" name="endTime" class="form-input" required>
            <div class="form-error" id="end-time-error"></div>
          </div>
        </div>
      </div>
      
      <div class="guests-group">
        <div class="form-field">
          <label for="cottage-adults" class="form-label">Number of Adults *</label>
          <input type="number" id="cottage-adults" name="cottageAdults" class="form-input" min="1" value="1" required>
          <div class="form-error" id="cottage-adults-error"></div>
        </div>
        
        <div class="form-field">
          <label for="cottage-children" class="form-label">Number of Children</label>
          <input type="number" id="cottage-children" name="cottageChildren" class="form-input" min="0" value="0">
        </div>
      </div>
      
      <div class="form-field">
        <label class="form-label">Cottage Selection *</label>
        <div class="checkbox-group">
          ${cottageTypes.map(cottage => `
            <label class="checkbox-item">
              <input type="checkbox" name="selectedCottages" value="${cottage}" required>
              <span class="checkbox-label">${cottage}</span>
            </label>
          `).join('')}
        </div>
        <div class="form-error" id="cottage-selection-error"></div>
      </div>
    </div>
    
    ${renderPaymentAndAgreement()}
  `;
}

// Render function hall booking fields
function renderFunctionHallFields() {
  return `
    <div class="form-section">
      <h3>Event Details</h3>
      
      <div class="form-field">
        <label for="organization" class="form-label">Organization (Optional)</label>
        <input type="text" id="organization" name="organization" class="form-input" placeholder="Company or organization name">
      </div>
      
      <div class="form-field">
        <label for="event-date" class="form-label">Event Date *</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="date" id="event-date" name="eventDate" class="form-input" required style="flex: 1;">
          <button type="button" class="calendar-icon-btn" onclick="openCalendarModal('function-halls', 'Function Hall Booking')" title="Select from calendar">
            📅
          </button>
        </div>
        <div class="form-error" id="event-date-error"></div>
      </div>
      
      <div class="form-field">
        <label class="form-label">Event Time Range *</label>
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="flex: 1;">
            <label for="event-start" class="form-label" style="font-size: 0.9em; margin-bottom: 4px;">Start Time</label>
            <input type="time" id="event-start" name="eventStart" class="form-input" required>
            <div class="form-error" id="event-start-error"></div>
          </div>
          <div style="flex: 1;">
            <label for="event-end" class="form-label" style="font-size: 0.9em; margin-bottom: 4px;">End Time</label>
            <input type="time" id="event-end" name="eventEnd" class="form-input" required>
            <div class="form-error" id="event-end-error"></div>
          </div>
        </div>
      </div>
      
      <div class="form-field">
        <label for="event-type" class="form-label">Event Type *</label>
        <select id="event-type" name="eventType" class="form-select" required>
          <option value="">Select Event Type</option>
          <option value="wedding">Wedding</option>
          <option value="birthday">Birthday Party</option>
          <option value="conference">Conference</option>
          <option value="meeting">Meeting</option>
          <option value="other">Other</option>
        </select>
        <div class="form-error" id="event-type-error"></div>
      </div>
      
      <div class="form-field">
        <label for="event-guests" class="form-label">Number of Guests *</label>
        <input type="number" id="event-guests" name="eventGuests" class="form-input" min="1" required>
        <div class="form-error" id="event-guests-error"></div>
      </div>
      
      <div class="form-field">
        <label class="form-label">Function Hall Selection *</label>
        <div class="radio-group">
          ${functionHallTypes.map(hall => `
            <label class="radio-item">
              <input type="radio" name="selectedHall" value="${hall}" required>
              <span class="radio-label">${hall}</span>
            </label>
          `).join('')}
        </div>
        <div class="form-error" id="hall-selection-error"></div>
      </div>
      
      <div class="form-field">
        <label for="special-requests" class="form-label">Special Requests</label>
        <textarea id="special-requests" name="specialRequests" class="form-textarea" rows="3" placeholder="Any special requirements or requests..."></textarea>
      </div>
    </div>
    
    ${renderPaymentAndAgreement()}
  `;
}

// Render payment and agreement section
function renderPaymentAndAgreement() {
  return `
    <div class="form-section">
      <h3>Payment & Agreement</h3>
      
      <div class="form-field">
        <label for="payment-mode" class="form-label">Mode of Payment *</label>
        <select id="payment-mode" name="paymentMode" class="form-select" required>
          <option value="">Select Payment Method</option>
          <option value="bank-transfer">Bank Transfer</option>
          <option value="gcash">GCash</option>
          <option value="credit-card">Credit Card</option>
        </select>
        <div class="form-error" id="payment-mode-error"></div>
      </div>
      
      <div class="agreement-section">
        <label class="agreement-checkbox">
          <input type="checkbox" id="agreement" name="agreement" required>
          <span class="agreement-text">
            I agree to the resort's 
            <a href="#" onclick="showPolicy()">booking and cancellation policy</a>
          </span>
        </label>
        <div class="form-error" id="agreement-error"></div>
      </div>
      
      <button type="submit" class="booking-submit-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4"></path>
          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
          <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"></path>
          <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"></path>
        </svg>
        ${getSubmitButtonText()}
      </button>
    </div>
  `;
}

// Get submit button text based on reservation type
function getSubmitButtonText() {
  switch (bookingFormState.reservationType) {
    case 'room':
      return 'Book My Room';
    case 'cottage':
      return 'Book Cottage';
    case 'function-hall':
      return 'Book Function Hall';
    default:
      return 'Complete Booking';
  }
}

// Generate room checkboxes with availability checking
function generateRoomCheckboxes() {
  const checkinDate = document.getElementById('checkin-date')?.value;
  const checkoutDate = document.getElementById('checkout-date')?.value;
  
  return roomTypes.map(room => {
    let isAvailable = true;
    let availabilityClass = '';
    let availabilityLabel = '';
    
    if (checkinDate && checkoutDate) {
      isAvailable = isRoomAvailable(room, checkinDate, checkoutDate);
      if (!isAvailable) {
        availabilityClass = 'unavailable';
        availabilityLabel = '<span class="not-available-label">Not Available</span>';
      }
    }
    
    return `
      <label class="checkbox-item ${availabilityClass}">
        <input type="checkbox" name="selectedRooms" value="${room}" ${!isAvailable ? 'disabled' : ''}>
        <span class="checkbox-label">
          <span class="${!isAvailable ? 'room-name-strike' : ''}">${room}</span>
          ${availabilityLabel}
        </span>
      </label>
    `;
  }).join('');
}

// Update room availability when dates change
function updateRoomAvailability() {
  const roomCheckboxes = document.getElementById('room-checkboxes');
  if (roomCheckboxes) {
    roomCheckboxes.innerHTML = generateRoomCheckboxes();
  }
}

// Toggle add cottage to room booking
function toggleAddCottage() {
  bookingFormState.addCottageToRoom = !bookingFormState.addCottageToRoom;
  const field = document.getElementById('cottage-selection-field');
  const button = document.querySelector('.add-option-toggle');
  
  if (bookingFormState.addCottageToRoom) {
    field.style.display = 'block';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Remove Cottage from Booking
    `;
  } else {
    field.style.display = 'none';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Add Cottage to Room Booking
    `;
  }
}

// Toggle add room to cottage booking
function toggleAddRoom() {
  bookingFormState.addRoomToCottage = !bookingFormState.addRoomToCottage;
  const field = document.getElementById('room-overnight-field');
  const button = document.querySelector('.add-option-toggle');
  
  if (bookingFormState.addRoomToCottage) {
    field.style.display = 'block';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Remove Room from Booking
    `;
  } else {
    field.style.display = 'none';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Add Room for Overnight Stay
    `;
  }
}

// Initialize form with event listeners
function initializeForm() {
  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.min = today;
  });
  
  // Pre-fill dates if provided
  if (bookingFormState.preFillDates) {
    if (bookingFormState.preFillDates.checkin && bookingFormState.preFillDates.checkout) {
      // Room booking - pre-fill check-in and check-out
      const checkinInput = document.getElementById('checkin-date');
      const checkoutInput = document.getElementById('checkout-date');
      if (checkinInput) checkinInput.value = bookingFormState.preFillDates.checkin;
      if (checkoutInput) checkoutInput.value = bookingFormState.preFillDates.checkout;
    } else if (bookingFormState.preFillDates.date) {
      // Cottage or function hall - pre-fill single date
      const dateInput = document.getElementById('cottage-date') || document.getElementById('event-date');
      if (dateInput) dateInput.value = bookingFormState.preFillDates.date;
    }
  }
  
  // Auto-calculate nights for room booking
  const checkinInput = document.getElementById('checkin-date');
  const checkoutInput = document.getElementById('checkout-date');
  const nightsDisplay = document.getElementById('nights-display');
  
  if (checkinInput && checkoutInput && nightsDisplay) {
    const calculateNights = () => {
      const checkin = new Date(checkinInput.value);
      const checkout = new Date(checkoutInput.value);
      
      if (checkin && checkout && checkout > checkin) {
        const diffTime = Math.abs(checkout - checkin);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        nightsDisplay.textContent = diffDays;
        // Update room availability when dates change
        updateRoomAvailability();
      } else {
        nightsDisplay.textContent = '0';
      }
    };
    
    checkinInput.addEventListener('change', calculateNights);
    checkoutInput.addEventListener('change', calculateNights);
    
    // Calculate nights on initial load if dates are pre-filled
    if (checkinInput.value && checkoutInput.value) {
      calculateNights();
    }
  }
  
  // Handle room selection based on number of rooms
  const numRoomsSelect = document.getElementById('num-rooms');
  
  if (numRoomsSelect) {
    numRoomsSelect.addEventListener('change', (e) => {
      const numRooms = parseInt(e.target.value);
      
      // Show instruction
      const instruction = document.createElement('div');
      instruction.className = 'room-selection-instruction';
      instruction.textContent = `Please select ${numRooms} room${numRooms > 1 ? 's' : ''}`;
      
      const existingInstruction = document.querySelector('.room-selection-instruction');
      if (existingInstruction) {
        existingInstruction.remove();
      }
      
      document.getElementById('room-selection-field').appendChild(instruction);
    });
  }
  
  // Real-time validation
  document.querySelectorAll('.form-input, .form-select').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => clearFieldError(input));
  });
}

// Validate individual field
function validateField(field) {
  const value = field.value.trim();
  const fieldName = field.name;
  let isValid = true;
  let errorMessage = '';
  
  // Required field validation
  if (field.hasAttribute('required') && !value) {
    isValid = false;
    errorMessage = 'This field is required';
  }
  
  // Email validation
  if (fieldName === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    }
  }
  
  // Phone validation
  if (fieldName === 'contact' && value) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid phone number';
    }
  }
  
  // Date validation
  if (field.type === 'date' && value) {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      isValid = false;
      errorMessage = 'Date cannot be in the past';
    }
  }
  
  // Check-out date validation
  if (fieldName === 'checkoutDate' && value) {
    const checkinDate = document.getElementById('checkin-date')?.value;
    if (checkinDate && value <= checkinDate) {
      isValid = false;
      errorMessage = 'Check-out date must be after check-in date';
    }
  }
  
  // Time validation
  if (field.type === 'time' && value) {
    const startTime = document.getElementById('start-time')?.value;
    const endTime = document.getElementById('end-time')?.value;
    
    if (fieldName === 'endTime' && startTime && value <= startTime) {
      isValid = false;
      errorMessage = 'End time must be after start time';
    }
  }
  
  // Number validation
  if (field.type === 'number' && value) {
    const min = field.getAttribute('min');
    if (min && parseInt(value) < parseInt(min)) {
      isValid = false;
      errorMessage = `Value must be at least ${min}`;
    }
  }
  
  // Update field appearance and error message
  if (isValid) {
    field.classList.remove('error');
    clearFieldError(field);
  } else {
    field.classList.add('error');
    showFieldError(field, errorMessage);
  }
  
  return isValid;
}

// Show field error
function showFieldError(field, message) {
  const errorElement = document.getElementById(`${field.name}-error`);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

// Clear field error
function clearFieldError(field) {
  const errorElement = document.getElementById(`${field.name}-error`);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
  field.classList.remove('error');
}

// Validate entire form
function validateForm() {
  let isValid = true;
  
  // Validate all input fields
  document.querySelectorAll('.form-input, .form-select').forEach(field => {
    if (!validateField(field)) {
      isValid = false;
    }
  });
  
  // Validate checkboxes/radio buttons
  if (bookingFormState.reservationType === 'room') {
    const selectedRooms = document.querySelectorAll('input[name="selectedRooms"]:checked');
    const numRooms = parseInt(document.getElementById('num-rooms')?.value || '1');
    
    if (selectedRooms.length !== numRooms) {
      isValid = false;
      showFieldError(document.getElementById('num-rooms'), `Please select exactly ${numRooms} room${numRooms > 1 ? 's' : ''}`);
    }
  }
  
  if (bookingFormState.reservationType === 'cottage') {
    const selectedCottages = document.querySelectorAll('input[name="selectedCottages"]:checked');
    if (selectedCottages.length === 0) {
      isValid = false;
      showFieldError(document.getElementById('cottage-selection-error'), 'Please select at least one cottage');
    }
  }
  
  if (bookingFormState.reservationType === 'function-hall') {
    const selectedHall = document.querySelector('input[name="selectedHall"]:checked');
    if (!selectedHall) {
      isValid = false;
      showFieldError(document.getElementById('hall-selection-error'), 'Please select a function hall');
    }
  }
  
  // Validate agreement checkbox
  const agreement = document.getElementById('agreement');
  if (!agreement?.checked) {
    isValid = false;
    showFieldError(agreement, 'You must agree to the booking policy');
  }
  
  return isValid;
}

// Submit booking form
function submitBooking(event) {
  event.preventDefault();
  
  if (!validateForm()) {
    // Scroll to first error
    const firstError = document.querySelector('.form-input.error, .form-select.error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  // Collect form data
  const formData = new FormData(event.target);
  const bookingData = {
    reservationType: bookingFormState.reservationType,
    guestInfo: {
      name: formData.get('guestName'),
      email: formData.get('email'),
      contact: formData.get('contact')
    },
    dates: {},
    guests: {},
    selections: {},
    payment: formData.get('paymentMode'),
    agreement: formData.get('agreement') === 'on'
  };
  
  // Add type-specific data
  if (bookingFormState.reservationType === 'room') {
    bookingData.dates = {
      checkin: formData.get('checkinDate'),
      checkout: formData.get('checkoutDate'),
      nights: document.getElementById('nights-display')?.textContent || '0'
    };
    bookingData.guests = {
      adults: formData.get('adults'),
      children: formData.get('children')
    };
    bookingData.selections = {
      rooms: Array.from(formData.getAll('selectedRooms')),
      cottages: bookingFormState.addCottageToRoom ? Array.from(formData.getAll('selectedCottages')) : []
    };
  } else if (bookingFormState.reservationType === 'cottage') {
    bookingData.dates = {
      date: formData.get('cottageDate'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime')
    };
    bookingData.guests = {
      adults: formData.get('cottageAdults'),
      children: formData.get('cottageChildren')
    };
    bookingData.selections = {
      cottages: Array.from(formData.getAll('selectedCottages')),
      rooms: bookingFormState.addRoomToCottage ? Array.from(formData.getAll('selectedRooms')) : []
    };
    
    if (bookingFormState.addRoomToCottage) {
      bookingData.dates.roomCheckin = formData.get('roomCheckin');
      bookingData.dates.roomCheckout = formData.get('roomCheckout');
    }
  } else if (bookingFormState.reservationType === 'function-hall') {
    bookingData.dates = {
      eventDate: formData.get('eventDate'),
      startTime: formData.get('eventStart'),
      endTime: formData.get('eventEnd')
    };
    bookingData.selections = {
      hall: formData.get('selectedHall'),
      eventType: formData.get('eventType'),
      specialRequests: formData.get('specialRequests')
    };
    bookingData.guests = {
      total: formData.get('eventGuests')
    };
  }
  
  // Log booking data (mock submission)
  console.log('Booking Submission:', bookingData);
  
  // Show success message
  showBookingSuccess(bookingData);
}

// Show booking success
function showBookingSuccess(bookingData) {
  const successHTML = `
    <div class="booking-success-modal">
      <div class="success-content">
        <div class="success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4"></path>
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
        </div>
        <h3>Booking Submitted Successfully!</h3>
        <p>Thank you for choosing Kina Resort. We'll contact you shortly to confirm your reservation.</p>
        
        <div class="booking-summary">
          <h4>Booking Summary:</h4>
          <div class="summary-item">
            <strong>Type:</strong> ${bookingData.reservationType.charAt(0).toUpperCase() + bookingData.reservationType.slice(1)} Reservation
          </div>
          <div class="summary-item">
            <strong>Guest:</strong> ${bookingData.guestInfo.name}
          </div>
          <div class="summary-item">
            <strong>Email:</strong> ${bookingData.guestInfo.email}
          </div>
          ${bookingData.dates.checkin ? `
            <div class="summary-item">
              <strong>Check-in:</strong> ${bookingData.dates.checkin}
            </div>
            <div class="summary-item">
              <strong>Check-out:</strong> ${bookingData.dates.checkout}
            </div>
          ` : ''}
          ${bookingData.dates.date ? `
            <div class="summary-item">
              <strong>Date:</strong> ${bookingData.dates.date}
            </div>
            <div class="summary-item">
              <strong>Time:</strong> ${bookingData.dates.startTime} - ${bookingData.dates.endTime}
            </div>
          ` : ''}
        </div>
        
        <button class="success-close-btn" onclick="closeBookingModal()">Close</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', successHTML);
  
  // Close main modal
  setTimeout(() => {
    closeBookingModal();
  }, 1000);
}

// Handle escape key
function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    closeBookingModal();
  }
}

// Show policy (placeholder)
function showPolicy() {
  alert('Booking and Cancellation Policy:\n\n- Cancellations made 48 hours before check-in: Full refund\n- Cancellations made 24-48 hours before check-in: 50% refund\n- Cancellations made less than 24 hours before check-in: No refund\n- No-shows: No refund\n\nFor more details, please contact our reservations team.');
}

// Make functions globally available
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.changeReservationType = changeReservationType;
window.toggleAddCottage = toggleAddCottage;
window.submitBooking = submitBooking;
window.showPolicy = showPolicy;
