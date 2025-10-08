// Klean - Waste Collection Route Optimizer JavaScript

// Configuration
const API_KEY = '5b3ce3597851110001cf6248f699bcd48cfa4e4facd7b6b0be138f78'; // OpenRouteService API key

// Gemini API Configuration
const GEMINI_API_KEY = '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';
const GEMINI_API_URL = 'https://api.gemini.com/v1/chat/completions';

// Global variables
let selectedPoints = [];
let markers = [];
let isSelectingMode = false;
let wasteCollectionMode = false;
let map;

// Waste tracking variables
let wasteData = [];
let currentWasteEntry = {};
let currentModalStep = 1;
let currentPointIndex = 0;

// ESP32 Dustbin Monitoring Variables
let sensorDustbins = {};
let sensorMarkers = {};
let dustbinPollingInterval = null;
let lastDustbinSync = null;
let dustbinNotifications = [];

// ESP32 Configuration
const DUSTBIN_API_BASE = 'http://localhost:5000/api';
const POLLING_INTERVAL = 15000; // 15 seconds
const NOTIFICATION_DURATION = 5000; // 5 seconds

// University data structures
const hostels = {
  'FDR': 'FDR',
  'EGR': 'EGR', 
  'HR': 'HR',
  'AR': 'AR'
};

const messes = {
  'north': { name: 'North Mess', specialty: 'Multi-cuisine' },
  'south': { name: 'South Mess', specialty: 'South Indian' },
  'andhra': { name: 'Andhra Mess', specialty: 'Andhra cuisine' },
  'kerala': { name: 'Kerala Mess', specialty: 'Kerala cuisine' },
  'nri': { name: 'NRI Mess', specialty: 'International' }
};

// Comprehensive University Menu System
const weeklyMenu = {
  monday: {
    breakfast: {
      north: { dish: "Pav Bhaji", type: "North Indian", ingredients: ["pav", "bhaji", "onions", "butter"] },
      south: { dish: "Idli Sambar", type: "South Indian", ingredients: ["idli", "sambar", "coconut chutney"] },
      andhra: { dish: "Pesarattu", type: "Andhra", ingredients: ["moong dal", "chutney", "ginger"] },
      kerala: { dish: "Appam with Stew", type: "Kerala", ingredients: ["appam", "vegetable stew", "coconut milk"] },
      nri: { dish: "Pancakes", type: "Continental", ingredients: ["pancakes", "maple syrup", "butter"] }
    },
    lunch: {
      north: { dish: "Rajma Rice", type: "North Indian", ingredients: ["rajma", "rice", "roti", "pickle"] },
      south: { dish: "Sambar Rice", type: "South Indian", ingredients: ["rice", "sambar", "rasam", "papad"] },
      andhra: { dish: "Gongura Rice", type: "Andhra", ingredients: ["gongura leaves", "rice", "dal", "pickle"] },
      kerala: { dish: "Fish Curry Rice", type: "Kerala", ingredients: ["fish curry", "rice", "coconut", "curry leaves"] },
      nri: { dish: "Pasta Marinara", type: "Italian", ingredients: ["pasta", "marinara sauce", "cheese", "bread"] }
    },
    dinner: {
      north: { dish: "Dal Makhani", type: "North Indian", ingredients: ["dal makhani", "roti", "rice", "salad"] },
      south: { dish: "Curd Rice", type: "South Indian", ingredients: ["curd rice", "pickle", "papad", "curry"] },
      andhra: { dish: "Andhra Chicken Curry", type: "Andhra", ingredients: ["chicken curry", "rice", "roti", "pickle"] },
      kerala: { dish: "Coconut Rice", type: "Kerala", ingredients: ["coconut rice", "sambar", "pickle", "papad"] },
      nri: { dish: "Fried Rice", type: "Chinese", ingredients: ["fried rice", "manchurian", "soup", "noodles"] }
    }
  },
  tuesday: {
    breakfast: {
      north: { dish: "Aloo Paratha", type: "North Indian", ingredients: ["aloo paratha", "curd", "pickle", "butter"] },
      south: { dish: "Dosa with Chutney", type: "South Indian", ingredients: ["dosa", "coconut chutney", "sambar"] },
      andhra: { dish: "Upma", type: "Andhra", ingredients: ["upma", "coconut chutney", "pickle"] },
      kerala: { dish: "Puttu Kadala", type: "Kerala", ingredients: ["puttu", "kadala curry", "banana"] },
      nri: { dish: "French Toast", type: "Continental", ingredients: ["french toast", "honey", "fruits"] }
    },
    lunch: {
      north: { dish: "Chole Bhature", type: "North Indian", ingredients: ["chole", "bhature", "onions", "pickle"] },
      south: { dish: "Lemon Rice", type: "South Indian", ingredients: ["lemon rice", "dal", "sambar", "papad"] },
      andhra: { dish: "Tomato Rice", type: "Andhra", ingredients: ["tomato rice", "dal", "pickle", "papad"] },
      kerala: { dish: "Meen Curry", type: "Kerala", ingredients: ["fish curry", "rice", "coconut oil", "pickle"] },
      nri: { dish: "Burgers", type: "American", ingredients: ["burger", "fries", "coleslaw", "ketchup"] }
    },
    dinner: {
      north: { dish: "Paneer Butter Masala", type: "North Indian", ingredients: ["paneer", "butter masala", "roti", "rice"] },
      south: { dish: "Vegetable Biryani", type: "South Indian", ingredients: ["veg biryani", "raita", "pickle", "curry"] },
      andhra: { dish: "Mutton Curry", type: "Andhra", ingredients: ["mutton curry", "rice", "roti", "pickle"] },
      kerala: { dish: "Prawn Curry", type: "Kerala", ingredients: ["prawn curry", "rice", "coconut", "pickle"] },
      nri: { dish: "Grilled Chicken", type: "Continental", ingredients: ["grilled chicken", "rice", "salad", "sauce"] }
    }
  },
  wednesday: {
    breakfast: {
      north: { dish: "Poha", type: "North Indian", ingredients: ["poha", "onions", "peanuts", "lemon"] },
      south: { dish: "Medu Vada", type: "South Indian", ingredients: ["medu vada", "sambar", "coconut chutney"] },
      andhra: { dish: "Rava Upma", type: "Andhra", ingredients: ["rava upma", "chutney", "pickle"] },
      kerala: { dish: "Idiyappam", type: "Kerala", ingredients: ["idiyappam", "coconut milk", "sugar"] },
      nri: { dish: "Cereals", type: "Continental", ingredients: ["cornflakes", "milk", "fruits", "honey"] }
    },
    lunch: {
      north: { dish: "Mixed Vegetable", type: "North Indian", ingredients: ["mixed veg", "roti", "rice", "dal"] },
      south: { dish: "Tamarind Rice", type: "South Indian", ingredients: ["tamarind rice", "dal", "papad", "pickle"] },
      andhra: { dish: "Bisi Bele Bath", type: "Andhra", ingredients: ["bisi bele bath", "raita", "pickle", "papad"] },
      kerala: { dish: "Vegetable Stew", type: "Kerala", ingredients: ["veg stew", "appam", "rice", "pickle"] },
      nri: { dish: "Pizza", type: "Italian", ingredients: ["pizza", "garlic bread", "salad", "cold drink"] }
    },
    dinner: {
      north: { dish: "Kadhi Chawal", type: "North Indian", ingredients: ["kadhi", "rice", "roti", "pickle"] },
      south: { dish: "Pongal", type: "South Indian", ingredients: ["pongal", "sambar", "chutney", "ghee"] },
      andhra: { dish: "Pappu Chaaru", type: "Andhra", ingredients: ["pappu", "chaaru", "rice", "pickle"] },
      kerala: { dish: "Sambar Rice", type: "Kerala", ingredients: ["sambar", "rice", "papad", "pickle"] },
      nri: { dish: "Stir Fry", type: "Asian", ingredients: ["stir fry", "noodles", "soup", "spring rolls"] }
    }
  },
  thursday: {
    breakfast: {
      north: { dish: "Stuffed Paratha", type: "North Indian", ingredients: ["stuffed paratha", "curd", "pickle", "butter"] },
      south: { dish: "Rava Dosa", type: "South Indian", ingredients: ["rava dosa", "sambar", "chutney"] },
      andhra: { dish: "Mirapakaya Bajji", type: "Andhra", ingredients: ["mirchi bajji", "chutney", "tea"] },
      kerala: { dish: "Nei Appam", type: "Kerala", ingredients: ["nei appam", "payasam", "coconut"] },
      nri: { dish: "Omelette", type: "Continental", ingredients: ["omelette", "bread", "butter", "jam"] }
    },
    lunch: {
      north: { dish: "Aloo Gobi", type: "North Indian", ingredients: ["aloo gobi", "roti", "rice", "dal"] },
      south: { dish: "Coconut Rice", type: "South Indian", ingredients: ["coconut rice", "sambar", "rasam", "pickle"] },
      andhra: { dish: "Chicken Biryani", type: "Andhra", ingredients: ["chicken biryani", "raita", "shorba", "pickle"] },
      kerala: { dish: "Karimeen Curry", type: "Kerala", ingredients: ["karimeen curry", "rice", "pickle", "papad"] },
      nri: { dish: "Sandwiches", type: "Continental", ingredients: ["sandwiches", "fries", "salad", "juice"] }
    },
    dinner: {
      north: { dish: "Bhindi Masala", type: "North Indian", ingredients: ["bhindi masala", "roti", "rice", "dal"] },
      south: { dish: "Rasam Rice", type: "South Indian", ingredients: ["rasam rice", "curry", "papad", "pickle"] },
      andhra: { dish: "Royyala Curry", type: "Andhra", ingredients: ["prawn curry", "rice", "dal", "pickle"] },
      kerala: { dish: "Avial", type: "Kerala", ingredients: ["avial", "rice", "sambar", "papad"] },
      nri: { dish: "Mexican Bowl", type: "Mexican", ingredients: ["burrito bowl", "salsa", "cheese", "nachos"] }
    }
  },
  friday: {
    breakfast: {
      north: { dish: "Chhole Kulche", type: "North Indian", ingredients: ["chole", "kulcha", "onions", "pickle"] },
      south: { dish: "Pongal", type: "South Indian", ingredients: ["pongal", "sambar", "chutney", "ghee"] },
      andhra: { dish: "Bondalu", type: "Andhra", ingredients: ["bondalu", "coconut chutney", "sambar"] },
      kerala: { dish: "Dosa", type: "Kerala", ingredients: ["dosa", "sambar", "chutney", "ghee"] },
      nri: { dish: "Waffles", type: "Continental", ingredients: ["waffles", "maple syrup", "fruits", "cream"] }
    },
    lunch: {
      north: { dish: "Palak Paneer", type: "North Indian", ingredients: ["palak paneer", "roti", "rice", "dal"] },
      south: { dish: "Vegetable Pulao", type: "South Indian", ingredients: ["veg pulao", "raita", "pickle", "papad"] },
      andhra: { dish: "Gutti Vankaya", type: "Andhra", ingredients: ["gutti vankaya", "rice", "dal", "pickle"] },
      kerala: { dish: "Malabar Biryani", type: "Kerala", ingredients: ["malabar biryani", "raita", "pickle", "shorba"] },
      nri: { dish: "Sushi", type: "Japanese", ingredients: ["sushi", "wasabi", "soy sauce", "miso soup"] }
    },
    dinner: {
      north: { dish: "Matar Paneer", type: "North Indian", ingredients: ["matar paneer", "roti", "rice", "dal"] },
      south: { dish: "Sambar Sadam", type: "South Indian", ingredients: ["sambar sadam", "pickle", "papad", "ghee"] },
      andhra: { dish: "Gongura Mutton", type: "Andhra", ingredients: ["gongura mutton", "rice", "roti", "pickle"] },
      kerala: { dish: "Fish Moilee", type: "Kerala", ingredients: ["fish moilee", "rice", "appam", "pickle"] },
      nri: { dish: "Thai Curry", type: "Thai", ingredients: ["thai curry", "rice", "spring rolls", "soup"] }
    }
  },
  saturday: {
    breakfast: {
      north: { dish: "Rajma Paratha", type: "North Indian", ingredients: ["rajma paratha", "curd", "pickle", "butter"] },
      south: { dish: "Uttapam", type: "South Indian", ingredients: ["uttapam", "sambar", "chutney"] },
      andhra: { dish: "Masala Dosa", type: "Andhra", ingredients: ["masala dosa", "sambar", "chutney", "ghee"] },
      kerala: { dish: "Pathiri", type: "Kerala", ingredients: ["pathiri", "fish curry", "coconut milk"] },
      nri: { dish: "Bagels", type: "Continental", ingredients: ["bagels", "cream cheese", "salmon", "coffee"] }
    },
    lunch: {
      north: { dish: "Butter Chicken", type: "North Indian", ingredients: ["butter chicken", "naan", "rice", "salad"] },
      south: { dish: "Bisi Bele Bath", type: "South Indian", ingredients: ["bisi bele bath", "raita", "pickle", "papad"] },
      andhra: { dish: "Pulihora", type: "Andhra", ingredients: ["pulihora", "dal", "pickle", "papad"] },
      kerala: { dish: "Puttu Curry", type: "Kerala", ingredients: ["puttu", "chicken curry", "pickle"] },
      nri: { dish: "Steaks", type: "Continental", ingredients: ["steak", "mashed potato", "salad", "wine"] }
    },
    dinner: {
      north: { dish: "Sarson Ka Saag", type: "North Indian", ingredients: ["sarson saag", "makki roti", "butter", "jaggery"] },
      south: { dish: "Ven Pongal", type: "South Indian", ingredients: ["ven pongal", "sambar", "chutney", "ghee"] },
      andhra: { dish: "Kodi Pulusu", type: "Andhra", ingredients: ["kodi pulusu", "rice", "pickle", "papad"] },
      kerala: { dish: "Beef Curry", type: "Kerala", ingredients: ["beef curry", "rice", "parotta", "pickle"] },
      nri: { dish: "BBQ Platter", type: "American", ingredients: ["bbq chicken", "corn", "coleslaw", "bread"] }
    }
  },
  sunday: {
    breakfast: {
      north: { dish: "Halwa Puri", type: "North Indian", ingredients: ["halwa", "puri", "chole", "pickle"] },
      south: { dish: "Rava Kesari", type: "South Indian", ingredients: ["rava kesari", "puri", "sambar"] },
      andhra: { dish: "Semiya Upma", type: "Andhra", ingredients: ["semiya upma", "coconut chutney", "pickle"] },
      kerala: { dish: "Chakka Pradhaman", type: "Kerala", ingredients: ["jackfruit pradhaman", "banana", "coconut"] },
      nri: { dish: "Brunch Special", type: "Continental", ingredients: ["eggs benedict", "hash browns", "bacon", "coffee"] }
    },
    lunch: {
      north: { dish: "Chicken Biryani", type: "North Indian", ingredients: ["chicken biryani", "raita", "shorba", "pickle"] },
      south: { dish: "Chicken Biryani", type: "South Indian", ingredients: ["chicken biryani", "raita", "shorba", "boiled egg"] },
      andhra: { dish: "Chicken Biryani", type: "Andhra", ingredients: ["chicken biryani", "raita", "shorba", "pickle"] },
      kerala: { dish: "Chicken Biryani", type: "Kerala", ingredients: ["chicken biryani", "raita", "shorba", "pickle"] },
      nri: { dish: "Chicken Biryani", type: "International", ingredients: ["chicken biryani", "raita", "shorba", "salad"] }
    },
    dinner: {
      north: { dish: "Special Thali", type: "North Indian", ingredients: ["dal", "sabzi", "roti", "rice", "sweet"] },
      south: { dish: "South Indian Thali", type: "South Indian", ingredients: ["sambar", "rasam", "curry", "rice", "sweet"] },
      andhra: { dish: "Andhra Thali", type: "Andhra", ingredients: ["pappu", "curry", "pickle", "rice", "sweet"] },
      kerala: { dish: "Kerala Sadya", type: "Kerala", ingredients: ["sambar", "avial", "thoran", "rice", "payasam"] },
      nri: { dish: "International Buffet", type: "Mixed", ingredients: ["pasta", "pizza", "salad", "dessert", "soup"] }
    }
  }
};

// Mouse tracking variables
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

// Dragging variables
let draggedElement = null;
let offsetX = 0;
let offsetY = 0;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeTheme();
  initializeMouseBackground();
  initializeMap();
  initializeDragging();
  initializeTiltEffects();
});

// Theme Management
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// Mouse Reactive Background
function initializeMouseBackground() {
  const mouseBackground = document.querySelector('.mouse-background');
  
  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth) * 100;
    targetY = (e.clientY / window.innerHeight) * 100;
    
    // Activate background on first mouse movement
    if (!mouseBackground.classList.contains('active')) {
      mouseBackground.classList.add('active');
    }
  });
  
  // Start mouse tracking animation
  updateMousePosition();
  
  // Create floating particles on click
  document.addEventListener('click', (e) => {
    // Create multiple particles for more intensity
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        createParticle(e.clientX + (Math.random() - 0.5) * 20, e.clientY + (Math.random() - 0.5) * 20);
      }, i * 100);
    }
  });
}

function updateMousePosition() {
  mouseX += (targetX - mouseX) * 0.15;
  mouseY += (targetY - mouseY) * 0.15;
  
  document.documentElement.style.setProperty('--mouse-x', mouseX + '%');
  document.documentElement.style.setProperty('--mouse-y', mouseY + '%');
  
  requestAnimationFrame(updateMousePosition);
}

function createParticle(x, y) {
  const particle = document.createElement('div');
  particle.className = 'particle';
  particle.style.left = x + 'px';
  particle.style.top = y + 'px';
  particle.style.width = Math.random() * 8 + 3 + 'px';
  particle.style.height = particle.style.width;
  
  document.body.appendChild(particle);
  
  // Remove particle after animation
  setTimeout(() => {
    if (particle.parentNode) {
      particle.parentNode.removeChild(particle);
    }
  }, 4000);
}

// Navigation
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  // Update active sidebar item
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  event.currentTarget.classList.add('active');
  
  // Refresh map if navigating to map section
  if (sectionId === 'map-section' || section.querySelector('#map')) {
    refreshMap();
  }
}

// Map Initialization
function initializeMap() {
  // Setup map - Centered on Coimbatore
  map = L.map('map').setView([11.016844, 76.955307], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  // Make map available globally for reports integration
  window.map = map;

  // Handle map clicks
  map.on('click', onMapClick);

  // Force map to refresh after page loads
  window.addEventListener('load', function() {
    setTimeout(function() {
      map.invalidateSize();
    }, 100);
  });
}

function refreshMap() {
  setTimeout(function() {
    map.invalidateSize();
  }, 100);
}

function onMapClick(e) {
  if (!isSelectingMode) return;
  
  const coord = [e.latlng.lng, e.latlng.lat]; // [longitude, latitude]
  
  // Add point to selection
  selectedPoints.push(coord);
  
  // Add simple numbered marker
  addSimpleMarker(coord, selectedPoints.length);
  
  // Update display
  updatePointsDisplay();
  
  console.log(`Added point ${selectedPoints.length} at [${coord[1].toFixed(6)}, ${coord[0].toFixed(6)}]`);
}

function updatePointsDisplay() {
  const totalPointsElement = document.getElementById('total-points');
  if (totalPointsElement) {
    totalPointsElement.textContent = selectedPoints.length;
  }
  
  // Show/hide Start button based on points selected
  const startBtn = document.getElementById('start-collection-btn');
  if (startBtn && !wasteCollectionMode) {
    startBtn.style.display = selectedPoints.length > 0 ? 'inline-block' : 'none';
  }
}

// Route Optimization
function optimizeRoute() {
  if (selectedPoints.length < 2) {
    alert('Please select at least 2 points first');
    return;
  }

  // Create circular route
  const routeCoordinates = [...selectedPoints, selectedPoints[0]];
  
  const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

  const requestData = {
    coordinates: routeCoordinates,
    profile: "driving-car",
    preference: "shortest",
    units: "km",
    geometry: true,
    instructions: true
  };

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, application/geo+json',
      'Authorization': API_KEY
    },
    body: JSON.stringify(requestData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Route API Response:', data);
    
    // Clear existing routes
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    if (data && data.features && data.features[0]) {
      const coordinates = data.features[0].geometry.coordinates;
      const routePoints = coordinates.map(coord => [coord[1], coord[0]]);
      
      // Draw the main route
      const routeLine = L.polyline(routePoints, {
          color: '#D32F2F',
          weight: 5,
          opacity: 0.9
      }).addTo(map);

      // Add directional arrows
      const decorator = L.polylineDecorator(routeLine, {
          patterns: [
              {
                  offset: '5%',
                  repeat: '15%',
                  symbol: L.Symbol.arrowHead({
                      pixelSize: 12,
                      polygon: false,
                      pathOptions: {
            color: '#D32F2F',
                          fillOpacity: 1,
                          weight: 2
                      }
                  })
              }
          ]
      }).addTo(map);

      // Markers are already created by the selection system, no need to recreate them
      // The route optimization only adds the route line and decorations
      
      // Update route info
      updateRouteInfo(data);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Failed to get route. Check console for details.');
  });
}

function updateRouteInfo(data) {
    console.log('Updating route info with data:', data);
    
    if (data.features && data.features[0]) {
        const properties = data.features[0].properties;
        const segments = properties.segments;
        
        if (!segments || segments.length === 0) {
            console.error('No segments found in response');
            updateRouteDisplay('--', '--', '--', '--');
            return;
        }
        
        // Calculate totals
        let totalDistance = 0;
        let totalDuration = 0;
        
        // Clear previous directions
        const directionsList = document.getElementById('directions-list');
        if (directionsList) {
            directionsList.innerHTML = '';
        }
        
        // Process each segment
        segments.forEach((segment, segIndex) => {
            totalDistance += segment.distance;
            totalDuration += segment.duration;
            
            // Process steps within segment
            if (directionsList && segment.steps) {
                segment.steps.forEach((step, stepIndex) => {
                    const instruction = step.instruction;
                    
                    const stepDiv = document.createElement('div');
                    stepDiv.className = 'direction-step';
                    stepDiv.innerHTML = `
                        <div class="step-number">${segIndex + 1}.${stepIndex + 1}</div>
                        <div class="step-instruction">
                            ${instruction}
                        </div>
                    `;
                    stepDiv.style.animationDelay = `${(segIndex * 0.1 + stepIndex * 0.05).toFixed(2)}s`;
                    directionsList.appendChild(stepDiv);
                });
            }
        });

        // Calculate route metrics
        const distanceKm = totalDistance > 100 ? (totalDistance / 1000).toFixed(2) : totalDistance.toFixed(2);
        const durationMins = Math.round(totalDuration / 60);
        const estimatedFuelCost = Math.round(parseFloat(distanceKm) * 8); // Rough estimate: ₹8 per km
        
        updateRouteDisplay(distanceKm, durationMins, estimatedFuelCost, selectedPoints.length);
    } else {
        updateRouteDisplay('--', '--', '--', selectedPoints.length);
        clearDirections();
    }
}

function updateRouteDisplay(distance, time, cost, points) {
    const elements = {
        'total-distance': `${distance} km`,
        'estimated-time': `${time} min`,
        'fuel-cost': `₹${cost}`,
        'total-points': points
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function clearDirections() {
    const directionsList = document.getElementById('directions-list');
    if (directionsList) {
        directionsList.innerHTML = '<div class="no-route">No route calculated yet. Add points and click "Optimize Route".</div>';
    }
}

// Control Functions
function toggleSelectionMode() {
  isSelectingMode = !isSelectingMode;
  wasteCollectionMode = false;
  
  const btn = document.getElementById('select-points-btn');
  const startBtn = document.getElementById('start-collection-btn');
  
  if (isSelectingMode) {
    btn.textContent = 'Stop Selecting';
    btn.classList.add('active');
    startBtn.style.display = selectedPoints.length > 0 ? 'inline-block' : 'none';
    showNotification('Click on map to add collection points', 'info');
  } else {
    btn.textContent = 'Select Points';
    btn.classList.remove('active');
    startBtn.style.display = selectedPoints.length > 0 ? 'inline-block' : 'none';
    showNotification('Point selection stopped', 'info');
  }
}

function startWasteCollection() {
  if (selectedPoints.length === 0) {
    showNotification('Please select collection points first', 'error');
    return;
  }
  
  wasteCollectionMode = true;
  isSelectingMode = false;
  
  console.log('Waste collection mode activated:', wasteCollectionMode);
  console.log('Number of markers:', markers.length);
  
  // Update UI
  const selectBtn = document.getElementById('select-points-btn');
  const startBtn = document.getElementById('start-collection-btn');
  
  selectBtn.style.display = 'none';
  startBtn.textContent = 'Collection Mode Active';
  startBtn.classList.add('active');
  
  // Add visual feedback to clickable markers
  addMarkerClickableEffects();
  
  showNotification(`Click on numbered markers (1, 2, 3...) to collect waste data. The "K" depot is not clickable.`, 'success');
}

function addMarkerClickableEffects() {
  // Add pulsing animation to numbered markers
  markers.forEach((marker, index) => {
    if (index > 0) { // Skip depot marker
      const markerElement = marker.getElement();
      if (markerElement) {
        const div = markerElement.querySelector('div');
        if (div) {
          div.style.animation = 'pulse 2s infinite';
          div.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
        }
      }
    }
  });
}

function scrollToAnalytics() {
  const analyticsSection = document.getElementById('analytics-section');
  if (analyticsSection) {
    analyticsSection.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start' 
    });
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
    });
    document.getElementById('analytics-btn').classList.add('active');
    
    // Update analytics when scrolled to
    updateAnalytics();
  }
}

// Map Controls
function resetMap() {
  // Clear all layers including decorators
  map.eachLayer((layer) => {
    if (layer instanceof L.Polyline || 
        layer instanceof L.Marker || 
        layer._polylineDecorators ||
        layer._layers) {
      map.removeLayer(layer);
    }
  });
  
  // Re-add the base tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  
  // Reset all variables
  selectedPoints = [];
  markers = [];
  isSelectingMode = false;
  wasteCollectionMode = false;
  wasteData = [];
  
  // Reset UI elements
  updateRouteDisplay('0', '0', '0', '0');
  clearDirections();
  
  // Reset buttons
  const selectBtn = document.getElementById('select-points-btn');
  const startBtn = document.getElementById('start-collection-btn');
  if (selectBtn) {
    selectBtn.textContent = 'Select Points';
    selectBtn.classList.remove('active');
    selectBtn.style.display = 'inline-block';
  }
  if (startBtn) {
    startBtn.style.display = 'none';
    startBtn.classList.remove('active');
  }
  
  // Reset map view
  map.setView([11.016844, 76.955307], 13);
}

function exportRoute() {
  if (selectedPoints.length === 0) {
    alert('No route to export. Please add points and optimize route first.');
    return;
  }
  
  const routeData = {
    points: selectedPoints,
    timestamp: new Date().toISOString(),
    totalPoints: selectedPoints.length
  };
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(routeData, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `klean-route-${Date.now()}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function shareRoute() {
  if (selectedPoints.length === 0) {
    alert('No route to share. Please add points first.');
    return;
  }
  
  const routeUrl = window.location.href;
  
  if (navigator.share) {
    navigator.share({
      title: 'Klean Route',
      text: `Check out this optimized waste collection route with ${selectedPoints.length} points!`,
      url: routeUrl
    });
  } else {
    // Fallback to copying to clipboard
    navigator.clipboard.writeText(routeUrl).then(() => {
      alert('Route URL copied to clipboard!');
    });
  }
}

// Dragging Functionality
function initializeDragging() {
  document.querySelectorAll('.draggable-widget').forEach(widget => {
    widget.addEventListener('mousedown', startDrag);
  });
}

function startDrag(e) {
  // Don't drag if clicking on buttons or interactive elements
  if (e.target.closest('button, .collapse-icon')) return;
  
  draggedElement = e.currentTarget;
  const rect = draggedElement.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  
  draggedElement.classList.add('dragging');
  
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', stopDrag);
  
  e.preventDefault();
}

function drag(e) {
  if (!draggedElement) return;
  
  const x = e.clientX - offsetX;
  const y = e.clientY - offsetY;
  
  // Keep within viewport bounds
  const maxX = window.innerWidth - draggedElement.offsetWidth;
  const maxY = window.innerHeight - draggedElement.offsetHeight;
  
  const boundedX = Math.max(0, Math.min(x, maxX));
  const boundedY = Math.max(0, Math.min(y, maxY));
  
  draggedElement.style.left = boundedX + 'px';
  draggedElement.style.top = boundedY + 'px';
  draggedElement.style.right = 'auto';
}

function stopDrag() {
  if (draggedElement) {
    draggedElement.classList.remove('dragging');
    draggedElement = null;
  }
  document.removeEventListener('mousemove', drag);
  document.removeEventListener('mouseup', stopDrag);
}

// Toggle Functions
function toggleCard(bodyId) {
  const body = document.getElementById(bodyId);
  const iconId = bodyId.replace('-body', '-icon');
  const icon = document.getElementById(iconId);
  
  if (body) body.classList.toggle('expanded');
  if (icon) icon.classList.toggle('collapsed');
}

function toggleSelectionMode() {
  isSelectingMode = !isSelectingMode;
  const btn = document.getElementById('selectModeBtn');
  
  if (btn) {
    if (isSelectingMode) {
      btn.textContent = 'Stop Selecting';
      btn.className = 'btn btn-secondary';
    } else {
      btn.textContent = 'Start Selecting Points';
      btn.className = 'btn btn-primary';
    }
  }
}

// Tilt Effects
function initializeTiltEffects() {
  const tiltElements = Array.from(document.querySelectorAll('.tilt, .btn'));
  tiltElements.forEach((el) => {
    const strength = el.classList.contains('btn') ? 6 : 10;
    el.addEventListener('pointermove', (ev) => {
      const rect = el.getBoundingClientRect();
      const px = (ev.clientX - rect.left) / rect.width - 0.5;
      const py = (ev.clientY - rect.top) / rect.height - 0.5;
      const rx = (py * -strength).toFixed(2);
      const ry = (px * strength).toFixed(2);
      el.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = 'perspective(600px) rotateX(0) rotateY(0)';
    });
  });
}

// Auto-enable selection mode when clicking on the map for the first time
document.addEventListener('DOMContentLoaded', function() {
  // Load saved waste data
  loadWasteData();
  
  // Initialize first click behavior
  const mapElement = document.getElementById('map');
  if (mapElement) {
    mapElement.addEventListener('click', function() {
      if (!isSelectingMode && !wasteCollectionMode && selectedPoints.length === 0) {
        toggleSelectionMode();
        console.log('Auto-enabled selection mode on first click');
      }
    }, { once: false });
  }
});

// Waste Modal Functions
function openWasteModal() {
  const modal = document.getElementById('waste-modal');
  modal.classList.add('active');
  currentModalStep = 1;
  resetModalSteps();
  showModalStep(1);
}

function closeWasteModal() {
  const modal = document.getElementById('waste-modal');
  modal.classList.remove('active');
  currentWasteEntry = {};
  resetModalSteps();
}

function resetModalSteps() {
  // Hide all steps
  document.querySelectorAll('.modal-step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Reset buttons
  document.getElementById('modal-back-btn').style.display = 'none';
  document.getElementById('modal-next-btn').style.display = 'inline-block';
  document.getElementById('modal-submit-btn').style.display = 'none';
  
  // Reset form states
  document.querySelectorAll('.waste-type-btn, .hostel-btn, .mess-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  document.getElementById('waste-weight').value = '';
}

function showModalStep(stepNumber) {
  // Hide all steps
  document.querySelectorAll('.modal-step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Show current step
  const currentStep = document.getElementById(`step-${getStepName(stepNumber)}`);
  if (currentStep) {
    currentStep.classList.add('active');
  }
  
  // Update today's menu display for food waste weight step
  if (currentWasteEntry.type === 'food' && stepNumber === 4 && currentWasteEntry.mess) {
    updateTodaysMenu(currentWasteEntry.mess);
  }
  
  // Update button visibility
  const backBtn = document.getElementById('modal-back-btn');
  const nextBtn = document.getElementById('modal-next-btn');
  const submitBtn = document.getElementById('modal-submit-btn');
  
  const maxSteps = getMaxSteps();
  
  if (stepNumber === 1) {
    backBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
    submitBtn.style.display = 'none';
  } else if ((currentWasteEntry.type === 'food' && stepNumber === 4) || 
             (currentWasteEntry.type !== 'food' && stepNumber === 4)) {
    // Last step for any waste type
    backBtn.style.display = 'inline-block';
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'inline-block';
  } else {
    backBtn.style.display = 'inline-block';
    nextBtn.style.display = 'inline-block';
    submitBtn.style.display = 'none';
  }
}

function getStepName(stepNumber) {
  const steps = ['waste-type', 'hostel', 'mess', 'weight'];
  return steps[stepNumber - 1];
}

function getMaxSteps() {
  return currentWasteEntry.type === 'food' ? 4 : 2; // Food waste has more steps
}

function selectWasteType(type) {
  currentWasteEntry.type = type;
  
  // Update UI
  document.querySelectorAll('.waste-type-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  document.querySelector(`[data-type="${type}"]`).classList.add('selected');
  
  // Update summary
  document.getElementById('summary-type').textContent = type.charAt(0).toUpperCase() + type.slice(1);
  
  // Show/hide hostel and mess containers based on type
  const hostelContainer = document.getElementById('summary-hostel-container');
  const messContainer = document.getElementById('summary-mess-container');
  const mealTimeContainer = document.getElementById('meal-time-container');
  
  if (type === 'food') {
    hostelContainer.style.display = 'flex';
    messContainer.style.display = 'flex';
    mealTimeContainer.style.display = 'block';
  } else {
    hostelContainer.style.display = 'none';
    messContainer.style.display = 'none';
    mealTimeContainer.style.display = 'none';
  }
}

function selectHostel(hostel) {
  currentWasteEntry.hostel = hostel;
  
  // Update UI
  document.querySelectorAll('.hostel-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  document.querySelector(`[data-hostel="${hostel}"]`).classList.add('selected');
  
  // Update summary
  document.getElementById('summary-hostel').textContent = hostel;
}

function selectMess(mess) {
  currentWasteEntry.mess = mess;
  
  // Update UI
  document.querySelectorAll('.mess-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  document.querySelector(`[data-mess="${mess}"]`).classList.add('selected');
  
  // Update summary
  document.getElementById('summary-mess').textContent = messes[mess].name;
}

function nextStep() {
  // Validate current step
  if (!validateCurrentStep()) {
    return;
  }
  
  currentModalStep++;
  
  // Skip hostel and mess steps for non-food waste
  if (currentWasteEntry.type !== 'food' && currentModalStep === 2) {
    currentModalStep = 4; // Jump to weight step
  }
  
  showModalStep(currentModalStep);
}

function previousStep() {
  currentModalStep--;
  
  // Skip hostel and mess steps for non-food waste
  if (currentWasteEntry.type !== 'food' && currentModalStep === 3) {
    currentModalStep = 1; // Jump back to waste type
  }
  
  showModalStep(currentModalStep);
}

function validateCurrentStep() {
  switch (currentModalStep) {
    case 1: // Waste type
      if (!currentWasteEntry.type) {
        alert('Please select a waste type');
        return false;
      }
      break;
    case 2: // Hostel (food waste only)
      if (currentWasteEntry.type === 'food' && !currentWasteEntry.hostel) {
        alert('Please select a hostel');
        return false;
      }
      break;
    case 3: // Mess (food waste only)
      if (currentWasteEntry.type === 'food' && !currentWasteEntry.mess) {
        alert('Please select a mess');
        return false;
      }
      break;
    case 4: // Weight
      const weight = parseFloat(document.getElementById('waste-weight').value);
      if (!weight || weight <= 0) {
        alert('Please enter a valid weight');
        return false;
      }
      break;
  }
  return true;
}

async function submitWasteData() {
  if (!validateCurrentStep()) {
    return;
  }
  
  // Get weight and meal time
  const weight = parseFloat(document.getElementById('waste-weight').value);
  const mealTime = document.getElementById('meal-time').value;
  
  // Complete the waste entry
  currentWasteEntry.weight = weight;
  if (currentWasteEntry.type === 'food') {
    currentWasteEntry.mealTime = mealTime;
    currentWasteEntry.day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    // Add dish information for food waste
    const currentDish = getCurrentDish(currentWasteEntry.mess);
    if (currentDish) {
      currentWasteEntry.dishInfo = {
        name: currentDish.name,
        type: currentDish.type,
        ingredients: currentDish.ingredients
      };
    }
  }
  
  // Add to waste data (coordinates already exist in selectedPoints)
  wasteData.push({...currentWasteEntry});
  
  // Update marker to show waste type color
  addWasteMarker(currentWasteEntry);
  
  // Save to localStorage
  saveWasteData();
  
  // Update displays
  updatePointsDisplay();
  await updateAnalytics(); // Now async with AI insights
  
  // Close modal
  closeWasteModal();
  
  // Show success message
  const dishInfo = currentWasteEntry.dishInfo ? ` (${currentWasteEntry.dishInfo.name})` : '';
  showNotification(`Added ${currentWasteEntry.type} waste data for point ${currentWasteEntry.pointNumber}${dishInfo} (${weight} kg)`, 'success');
}

function addSimpleMarker(coord, pointNumber, popupContent = null) {
  console.log('addSimpleMarker called with coord:', coord, 'pointNumber:', pointNumber);
  
  let markerContent;
  let markerStyle;
  if (pointNumber === 1) {
    markerContent = 'K';
    markerStyle = `
      background-color: #B71C1C;
      color: white;
      border-radius: 8px;
      width: 28px;
      height: 28px;
      line-height: 28px;
      text-align: center;
      font-weight: bold;
      font-family: 'Press Start 2P', cursive;
      font-size: 12px;
      border: 2px solid white;
      box-shadow: 0 0 6px rgba(0,0,0,0.4);
    `;
  } else {
    markerContent = pointNumber - 1;
    markerStyle = `
      background-color: #757575;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
      cursor: pointer;
    `;
  }
  
  console.log('Creating marker at lat:', coord[1], 'lng:', coord[0]);
  
  const marker = L.marker([coord[1], coord[0]], {
    icon: L.divIcon({
      className: 'custom-div-icon',
      html: `<div style='${markerStyle}' data-point-index="${pointNumber - 1}">${markerContent}</div>`,
      iconSize: pointNumber === 1 ? [32, 32] : [28, 28],
      iconAnchor: pointNumber === 1 ? [16, 16] : [14, 14]
    }),
    zIndexOffset: 1000
  }).addTo(map);
  
  console.log('Marker created and added to map:', marker);
  
  if (popupContent) {
    marker.bindPopup(popupContent);
    console.log('Popup bound to marker with content:', popupContent);
  } else if (pointNumber > 1) {
    marker.on('click', function(e) {
      e.originalEvent.stopPropagation();
      if (wasteCollectionMode) {
        const arrayIndex = pointNumber - 1;
        startWasteCollectionForPoint(arrayIndex);
      } else {
        showNotification('Click "Start Collection" first to collect waste data', 'info');
      }
    });
  }
  markers.push(marker);
  console.log('Marker added to markers array. Total markers:', markers.length);
}

// Function to add collection points from approved reports
function addCollectionPoint(latlng, label, popupContent = null) {
  console.log('Adding collection point:', latlng, label);
  console.log('LatLng object:', latlng);
  console.log('Coordinates - lat:', latlng.lat, 'lng:', latlng.lng);
  
  const coord = [latlng.lng, latlng.lat];
  console.log('Converted coord array [lng, lat]:', coord);
  
  selectedPoints.push(coord);
  console.log('selectedPoints after push:', selectedPoints);
  
  addSimpleMarker(coord, selectedPoints.length, popupContent);
  updatePointsDisplay();
  
  console.log('Collection point added. Total points:', selectedPoints.length);
  console.log('Markers array length:', markers.length);
  showNotification(`${label} added to collection route`, 'success');
}

// Make addCollectionPoint available globally
window.addCollectionPoint = addCollectionPoint;

function startWasteCollectionForPoint(arrayIndex) {
  console.log('Starting waste collection for array index:', arrayIndex);
  console.log('Selected points:', selectedPoints);
  console.log('Total points:', selectedPoints.length);
  
  // arrayIndex directly references the selectedPoints array
  // arrayIndex 1 = point 1, arrayIndex 2 = point 2, etc.
  
  if (arrayIndex >= selectedPoints.length || arrayIndex < 1) {
    showNotification(`Invalid point. Please select points first.`, 'error');
    console.log('Invalid array index:', arrayIndex, 'for array length:', selectedPoints.length);
    return;
  }
  
  const coord = selectedPoints[arrayIndex];
  console.log('Coordinate for point:', coord);
  
  // Set up waste entry for this specific point
  currentWasteEntry = {
    coordinates: coord,
    timestamp: new Date(),
    pointNumber: arrayIndex, // Display number (1, 2, 3...)
    pointIndex: arrayIndex - 1 // Store 0-based index for reference (0, 1, 2...)
  };
  
  console.log('Opening waste modal for entry:', currentWasteEntry);
  
  // Open waste tracking modal
  openWasteModal();
}

function addWasteMarker(wasteEntry) {
  // Update the existing marker with waste type color
  const pointIndex = wasteEntry.pointIndex;
  const marker = markers[pointIndex + 1]; // +1 because depot is at index 0
  
  if (!marker) return;
  
  // Color coding based on waste type
  let backgroundColor;
  switch (wasteEntry.type) {
    case 'food':
      backgroundColor = '#D32F2F'; // Red for food
      break;
    case 'plastic':
      backgroundColor = '#2196F3'; // Blue for plastic
      break;
    case 'misc':
      backgroundColor = '#FF9800'; // Orange for misc
      break;
    default:
      backgroundColor = '#757575'; // Gray for others
  }
  
  // Update marker style to show waste type
  const markerContent = pointIndex + 1;
  const markerStyle = `
    background-color: ${backgroundColor}; 
    color: white; 
    border-radius: 50%; 
    width: 24px; 
    height: 24px; 
    line-height: 24px; 
    text-align: center; 
    font-weight: bold;
    border: 2px solid white;
    box-shadow: 0 0 4px rgba(0,0,0,0.4);
    cursor: pointer;
  `;
  
  // Update the marker icon
  marker.setIcon(L.divIcon({
    className: 'custom-div-icon',
    html: `<div style='${markerStyle}' data-point-index="${pointIndex}">${markerContent}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  }));
  
  // Remove pulse animation once data is collected
  const markerElement = marker.getElement();
  if (markerElement) {
    const div = markerElement.querySelector('div');
    if (div) {
      div.style.animation = 'none';
      div.style.boxShadow = '0 0 4px rgba(0,0,0,0.4)';
    }
  }
  
  // Create popup content
  let popupContent = `
    <div class="waste-popup">
      <h4>Collection Point ${wasteEntry.pointNumber}</h4>
      <p><strong>Type:</strong> ${wasteEntry.type.charAt(0).toUpperCase() + wasteEntry.type.slice(1)}</p>
      <p><strong>Weight:</strong> ${wasteEntry.weight} kg</p>
  `;
  
  if (wasteEntry.type === 'food') {
    popupContent += `
      <p><strong>Hostel:</strong> ${wasteEntry.hostel}</p>
      <p><strong>Mess:</strong> ${messes[wasteEntry.mess].name}</p>
      <p><strong>Meal:</strong> ${wasteEntry.mealTime.charAt(0).toUpperCase() + wasteEntry.mealTime.slice(1)}</p>
    `;
  }
  
  popupContent += `
      <p><strong>Time:</strong> ${wasteEntry.timestamp.toLocaleTimeString()}</p>
    </div>
  `;
  
  marker.bindPopup(popupContent);
}
  const coord = wasteEntry.coordinates;
  let markerContent;
  let markerStyle;
  let backgroundColor;
  
  // Color coding based on waste type
  switch (wasteEntry.type) {
    case 'food':
      backgroundColor = '#D32F2F'; // Red for food
      break;
    case 'plastic':
      backgroundColor = '#2196F3'; // Blue for plastic
      break;
    case 'misc':
      backgroundColor = '#FF9800'; // Orange for misc
      break;
    default:
      backgroundColor = '#757575'; // Gray for others
  }
  
  if (selectedPoints.length === 1) {
    // First point is the depot with pixel "K"
    markerContent = 'K';
    markerStyle = `
      background-color: #B71C1C; 
      color: white; 
      border-radius: 8px; 
      width: 28px; 
      height: 28px; 
      line-height: 28px; 
      text-align: center; 
      font-weight: bold;
      font-family: 'Press Start 2P', cursive;
      font-size: 12px;
      border: 2px solid white;
      box-shadow: 0 0 6px rgba(0,0,0,0.4);
    `;
  } else {
    // Subsequent points are numbered starting from 1
    markerContent = selectedPoints.length - 1;
    markerStyle = `
      background-color: ${backgroundColor}; 
      color: white; 
      border-radius: 50%; 
      width: 24px; 
      height: 24px; 
      line-height: 24px; 
      text-align: center; 
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.4);
    `;
  }
  
  // Create popup content
  let popupContent = `
    <div class="waste-popup">
      <h4>Collection Point ${wasteEntry.pointNumber}</h4>
      <p><strong>Type:</strong> ${wasteEntry.type.charAt(0).toUpperCase() + wasteEntry.type.slice(1)}</p>
      <p><strong>Weight:</strong> ${wasteEntry.weight} kg</p>
  `;
  
  if (wasteEntry.type === 'food') {
    popupContent += `
      <p><strong>Hostel:</strong> ${wasteEntry.hostel}</p>
      <p><strong>Mess:</strong> ${messes[wasteEntry.mess].name}</p>
      <p><strong>Meal:</strong> ${wasteEntry.mealTime.charAt(0).toUpperCase() + wasteEntry.mealTime.slice(1)}</p>
    `;
  }
  
  popupContent += `
      <p><strong>Time:</strong> ${wasteEntry.timestamp.toLocaleTimeString()}</p>
    </div>
  `;
  
  // Add the marker
  const marker = L.marker([coord[1], coord[0]], {
    icon: L.divIcon({
      className: 'custom-div-icon',
      html: `<div style='${markerStyle}'>${markerContent}</div>`,
      iconSize: selectedPoints.length === 1 ? [32, 32] : [28, 28],
      iconAnchor: selectedPoints.length === 1 ? [16, 16] : [14, 14]
    })
  }).addTo(map);
  
  marker.bindPopup(popupContent);
  markers.push(marker);


// Analytics Functions
function openAnalytics() {
  const analytics = document.getElementById('analytics-panel');
  analytics.classList.add('active');
  updateAnalytics();
}

function closeAnalytics() {
  const analytics = document.getElementById('analytics-panel');
  analytics.classList.remove('active');
}

async function updateAnalytics() {
  updateWeeklyStats();
  updateTopGenerators();
  updateMessComparison();
  await updateInsights(); // Original insights
  updateInsightsDisplay(); // New food waste insights
}

function updateWeeklyStats() {
  const weekData = getWeeklyData();
  
  document.getElementById('weekly-food').textContent = `${weekData.food.toFixed(1)} kg`;
  document.getElementById('weekly-plastic').textContent = `${weekData.plastic.toFixed(1)} kg`;
  document.getElementById('weekly-misc').textContent = `${weekData.misc.toFixed(1)} kg`;
}

function updateTopGenerators() {
  const generators = getTopWasteGenerators();
  const container = document.getElementById('top-generators');
  
  if (generators.length === 0) {
    container.innerHTML = '<div class="generator-item"><span class="rank">-</span><span class="name">No data yet</span><span class="amount">0 kg</span></div>';
    return;
  }
  
  container.innerHTML = generators.map((gen, index) => `
    <div class="generator-item">
      <span class="rank">${index + 1}.</span>
      <span class="name">${gen.name}</span>
      <span class="amount">${gen.amount.toFixed(1)} kg</span>
    </div>
  `).join('');
}

function updateMessComparison() {
  const messData = getMessWasteData();
  const container = document.getElementById('mess-comparison');
  const maxWaste = Math.max(...Object.values(messData));
  
  container.innerHTML = Object.entries(messData).map(([messId, amount]) => `
    <div class="mess-bar" data-mess="${messId}">
      <span class="mess-label">${messes[messId].name.split(' ')[0]}</span>
      <div class="bar-container">
        <div class="bar" style="width: ${maxWaste > 0 ? (amount / maxWaste) * 100 : 0}%"></div>
      </div>
      <span class="mess-amount">${amount.toFixed(1)} kg</span>
    </div>
  `).join('');
}

async function updateInsights() {
  const insights = await generateInsights();
  const container = document.getElementById('insights-list');
  
  if (!container) return;
  
  if (insights.length === 0) {
    container.innerHTML = '<div class="insight-item"><div class="insight-icon">!</div><div class="insight-text">Start collecting waste data to generate insights</div></div>';
    return;
  }
  
  container.innerHTML = insights.map(insight => `
    <div class="insight-item">
      <div class="insight-icon">${insight.icon}</div>
      <div class="insight-text">${insight.text}</div>
    </div>
  `).join('');
}

// Grok API Functions
async function generateAIInsights(wasteDataSummary) {
  try {
    const prompt = `You are an expert waste management analyst for a university campus. Analyze the following waste collection data and provide 3-4 actionable insights and recommendations:

University Waste Data:
${JSON.stringify(wasteDataSummary, null, 2)}

Please provide insights in this exact format:
1. [Insight about highest waste generators or patterns]
2. [Recommendation for waste reduction strategy]
3. [Environmental impact observation]
4. [Operational efficiency suggestion]

Keep each insight concise (1-2 sentences) and actionable. Focus on university-specific waste management strategies.`;

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API Error Response:', errorData);
      throw new Error(`API request failed: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return null;
  }
}

function prepareDataForAI() {
  const weekData = getWeeklyData();
  const messData = getMessWasteData();
  const topGenerators = getTopWasteGenerators();
  const dayWaste = analyzeWasteByDay();
  const dishAnalysis = analyzeDishWaste();
  const unpopularDishes = getUnpopularDishes();
  
  return {
    totalWeeklyWaste: {
      food: weekData.food,
      plastic: weekData.plastic,
      misc: weekData.misc,
      total: weekData.food + weekData.plastic + weekData.misc
    },
    messesByWaste: messData,
    topWasteGenerators: topGenerators,
    wasteByDay: dayWaste,
    dishWasteAnalysis: dishAnalysis,
    unpopularDishes: unpopularDishes,
    totalCollectionPoints: wasteData.length,
    averageWastePerPoint: wasteData.length > 0 ? (weekData.food + weekData.plastic + weekData.misc) / wasteData.length : 0
  };
}

// Dish Analysis Functions
function analyzeDishWaste() {
  const dishWaste = {};
  
  wasteData.forEach(entry => {
    if (entry.type === 'food' && entry.dish && entry.mess) {
      const dishInfo = entry.dish;
      const dishKey = `${dishInfo.name} (${dishInfo.type})`;
      
      if (!dishWaste[dishKey]) {
        dishWaste[dishKey] = {
          dish: dishInfo.name,
          type: dishInfo.type,
          ingredients: dishInfo.ingredients,
          totalWaste: 0,
          occurrences: 0,
          mess: entry.mess,
          avgWastePerServing: 0
        };
      }
      
      dishWaste[dishKey].totalWaste += parseFloat(entry.weight) || 0;
      dishWaste[dishKey].occurrences += 1;
      dishWaste[dishKey].avgWastePerServing = dishWaste[dishKey].totalWaste / dishWaste[dishKey].occurrences;
    }
  });
  
  return dishWaste;
}

function getUnpopularDishes() {
  const dishAnalysis = analyzeDishWaste();
  
  // Sort dishes by average waste per serving (higher = more unpopular)
  const sortedDishes = Object.values(dishAnalysis)
    .filter(dish => dish.occurrences >= 1) // Only dishes that have been served
    .sort((a, b) => b.avgWastePerServing - a.avgWastePerServing);
  
  return sortedDishes.slice(0, 10); // Top 10 most wasted dishes
}

function getPopularDishes() {
  const dishAnalysis = analyzeDishWaste();
  
  // Sort dishes by average waste per serving (lower = more popular)
  const sortedDishes = Object.values(dishAnalysis)
    .filter(dish => dish.occurrences >= 1)
    .sort((a, b) => a.avgWastePerServing - b.avgWastePerServing);
  
  return sortedDishes.slice(0, 5); // Top 5 least wasted (most popular) dishes
}

function getDishWasteByMess() {
  const messWaste = {};
  
  wasteData.forEach(entry => {
    if (entry.type === 'food' && entry.mess && entry.day && entry.mealTime) {
      const day = entry.day;
      const meal = entry.mealTime;
      const mess = entry.mess;
      
      if (!messWaste[mess]) {
        messWaste[mess] = {};
      }
      
      if (weeklyMenu[day] && weeklyMenu[day][meal] && weeklyMenu[day][meal][mess]) {
        const dishInfo = weeklyMenu[day][meal][mess];
        const dishName = dishInfo.dish;
        
        if (!messWaste[mess][dishName]) {
          messWaste[mess][dishName] = {
            totalWaste: 0,
            occurrences: 0
          };
        }
        
        messWaste[mess][dishName].totalWaste += entry.weight;
        messWaste[mess][dishName].occurrences += 1;
      }
    }
  });
  
  return messWaste;
}

// Get current meal based on time of day
function getCurrentMeal() {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 7 && hour < 11) {
        return 'Breakfast';
    } else if (hour >= 11 && hour < 17) {
        return 'Lunch';
    } else {
        return 'Dinner';
    }
}

// Get current day of week
function getCurrentDay() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
}

// Get current dish for a specific mess
function getCurrentDish(messName) {
    const currentDay = getCurrentDay().toLowerCase();
    const currentMeal = getCurrentMeal().toLowerCase();
    
    console.log('Getting current dish for:', messName, currentDay, currentMeal);
    
    if (weeklyMenu[currentDay] && weeklyMenu[currentDay][currentMeal] && weeklyMenu[currentDay][currentMeal][messName]) {
        const dishData = weeklyMenu[currentDay][currentMeal][messName];
        console.log('Found current dish:', dishData);
        return {
            name: dishData.dish,
            type: dishData.type,
            ingredients: dishData.ingredients
        };
    }
    
    console.log('No current dish found for:', messName, currentDay, currentMeal);
    return null;
}

// Get dish based on specific day, meal, and mess
function getCurrentDishByDateTime(messName, dayName, mealTime) {
    console.log('Getting dish for:', messName, dayName, mealTime);
    
    // Convert day name to lowercase and handle format differences
    const day = dayName.toLowerCase();
    
    // Convert meal time to proper format
    let meal = mealTime;
    if (typeof mealTime === 'string') {
        meal = mealTime.toLowerCase();
        // Map meal time variants
        if (meal.includes('breakfast') || meal === 'morning') meal = 'breakfast';
        else if (meal.includes('lunch') || meal === 'noon') meal = 'lunch';
        else if (meal.includes('dinner') || meal === 'evening') meal = 'dinner';
    }
    
    console.log('Looking for menu:', day, meal, messName);
    console.log('WeeklyMenu structure check:', weeklyMenu[day]);
    
    if (weeklyMenu[day] && weeklyMenu[day][meal] && weeklyMenu[day][meal][messName]) {
        const dish = weeklyMenu[day][meal][messName];
        console.log('Found dish:', dish);
        return {
            name: dish.dish,
            type: dish.type,
            ingredients: dish.ingredients
        };
    }
    
    console.log('No dish found for:', day, meal, messName);
    return null;
}

// Update today's menu display in modal
function updateTodaysMenu(messName) {
    const dishNameEl = document.getElementById('dish-name');
    const dishTypeEl = document.getElementById('dish-type');
    const dishIngredientsEl = document.getElementById('dish-ingredients');
    
    if (!dishNameEl || !dishTypeEl || !dishIngredientsEl) {
        console.warn('Menu display elements not found');
        return;
    }
    
    const currentDish = getCurrentDish(messName);
    
    if (currentDish) {
        dishNameEl.textContent = currentDish.name;
        dishTypeEl.textContent = currentDish.type;
        dishIngredientsEl.textContent = `Ingredients: ${currentDish.ingredients.join(', ')}`;
    } else {
        dishNameEl.textContent = 'Menu not available';
        dishTypeEl.textContent = 'N/A';
        dishIngredientsEl.textContent = 'No ingredients information available';
    }
}

// Calculate most wasted foods for insights display
function getMostWastedFoods(limit = 5) {
    console.log('Getting most wasted foods, wasteData:', wasteData);
    const dishWaste = {};
    
    wasteData.forEach(entry => {
        console.log('Processing entry:', entry);
        if (entry.type === 'food' && entry.dishInfo) {
            const dishKey = `${entry.dishInfo.name} (${entry.mess})`;
            console.log('Found food entry with dish:', entry.dishInfo.name);
            
            if (!dishWaste[dishKey]) {
                dishWaste[dishKey] = {
                    name: entry.dishInfo.name,
                    type: entry.dishInfo.type,
                    mess: entry.mess,
                    totalWaste: 0,
                    count: 0
                };
            }
            
            dishWaste[dishKey].totalWaste += parseFloat(entry.weight) || 0;
            dishWaste[dishKey].count += 1;
        } else if (entry.type === 'food') {
            console.log('Food entry without dishInfo:', entry);
            // Fallback: try to get current dish based on day/time/mess
            const currentDay = entry.day || getCurrentDay();
            const currentMeal = entry.mealTime || getCurrentMeal();
            const currentDish = getCurrentDishByDateTime(entry.mess, currentDay, currentMeal);
            
            if (currentDish) {
                const dishKey = `${currentDish.name} (${entry.mess})`;
                console.log('Using fallback dish:', currentDish.name);
                
                if (!dishWaste[dishKey]) {
                    dishWaste[dishKey] = {
                        name: currentDish.name,
                        type: currentDish.type,
                        mess: entry.mess,
                        totalWaste: 0,
                        count: 0
                    };
                }
                
                dishWaste[dishKey].totalWaste += parseFloat(entry.weight) || 0;
                dishWaste[dishKey].count += 1;
            }
        }
    });
    
    console.log('Dish waste summary:', dishWaste);
    
    // Calculate average waste and sort
    const sortedDishes = Object.values(dishWaste)
        .map(dish => ({
            ...dish,
            avgWaste: dish.totalWaste / dish.count
        }))
        .sort((a, b) => b.totalWaste - a.totalWaste)
        .slice(0, limit);
    
    console.log('Sorted dishes:', sortedDishes);
    return sortedDishes;
}

// Update most wasted foods display
function updateMostWastedFoodsDisplay() {
    console.log('Updating most wasted foods display');
    const container = document.getElementById('wasted-foods-list');
    if (!container) {
        console.log('Container not found');
        return;
    }
    
    const wastedFoods = getMostWastedFoods(5);
    console.log('Wasted foods to display:', wastedFoods);
    
    if (wastedFoods.length === 0) {
        console.log('No wasted foods found, showing placeholder');
        container.innerHTML = `
            <div class="wasted-food-item placeholder">
                <div class="food-rank">#</div>
                <div class="food-details">
                    <div class="food-name">Start collecting waste data</div>
                    <div class="food-type">to see insights</div>
                </div>
                <div class="waste-amount">0 kg</div>
            </div>
        `;
        return;
    }
    
    console.log('Displaying', wastedFoods.length, 'wasted foods');
    container.innerHTML = wastedFoods.map((food, index) => `
        <div class="wasted-food-item">
            <div class="food-rank">${index + 1}</div>
            <div class="food-details">
                <div class="food-name">${food.name}</div>
                <div class="food-type">${food.type} • ${messes[food.mess]?.name || food.mess}</div>
            </div>
            <div class="waste-amount">${food.totalWaste.toFixed(1)} kg</div>
        </div>
    `).join('');
}

// Generate enhanced AI insights about food waste
async function generateFoodWasteInsights() {
    const insightsContainer = document.getElementById('ai-insights-list');
    const loadingContainer = document.getElementById('insights-loading');
    
    if (!insightsContainer) return;
    
    // Show loading briefly for visual feedback
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
        setTimeout(() => {
            loadingContainer.style.display = 'none';
        }, 500);
    }
    
    try {
        const wastedFoods = getMostWastedFoods(10);
        const messData = getMessWasteData();
        const weekData = getWeeklyData();
        
        if (wastedFoods.length === 0) {
            insightsContainer.innerHTML = `
                <div class="insight-item">
                    <div class="insight-icon"></div>
                    <div class="insight-text">Collect more waste data to generate personalized insights about food preferences and waste patterns.</div>
                </div>
            `;
            return;
        }
        
        // Generate insights based on data patterns
        const insights = generateLocalInsights(wastedFoods, messData, weekData);
        
        insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-text">${insight.text}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error generating insights:', error);
        insightsContainer.innerHTML = `
            <div class="insight-item">
                <div class="insight-icon">⚠️</div>
                <div class="insight-text">Unable to generate insights at the moment. Please try again later.</div>
            </div>
        `;
    }
}

// Generate insights using local data analysis
function generateLocalInsights(wastedFoods, messData, weekData) {
    console.log('Generating local insights with data:', { wastedFoods, messData, weekData });
    const insights = [];
    const totalFoodWaste = weekData.food;
    
    // Insight 1: Most wasted food
    if (wastedFoods.length > 0) {
        const topWasted = wastedFoods[0];
        console.log('Adding insight for top wasted food:', topWasted);
        insights.push({
            icon: '❖',
            text: `${topWasted.name} is the most wasted dish with ${topWasted.totalWaste.toFixed(1)}kg of waste. Consider reviewing the recipe or portion sizes for this ${topWasted.type} dish.`
        });
    } else {
        console.log('No wasted foods data, adding default insight');
        insights.push({
            icon: '⧉',
            text: 'Start collecting food waste data to identify which dishes students prefer least.'
        });
    }
    
    // Insight 2: Mess comparison
    const messEntries = Object.entries(messData);
    if (messEntries.length > 0) {
        const sortedMesses = messEntries.sort((a, b) => b[1] - a[1]);
        const highestMess = sortedMesses[0];
        const lowestMess = sortedMesses[sortedMesses.length - 1];
        
        if (highestMess[1] > 0) {
            insights.push({
                icon: '✦',
                text: `${messes[highestMess[0]]?.name || highestMess[0]} mess generates the most food waste (${highestMess[1].toFixed(1)}kg), while ${messes[lowestMess[0]]?.name || lowestMess[0]} generates the least (${lowestMess[1].toFixed(1)}kg).`
            });
        }
    }
    
    // Insight 3: Waste pattern analysis
    if (wastedFoods.length >= 3) {
        const cuisineTypes = {};
        wastedFoods.slice(0, 5).forEach(food => {
            cuisineTypes[food.type] = (cuisineTypes[food.type] || 0) + food.totalWaste;
        });
        
        const topCuisine = Object.entries(cuisineTypes).sort((a, b) => b[1] - a[1])[0];
        if (topCuisine) {
            insights.push({
                icon: '⧓',
                text: `${topCuisine[0]} cuisine has the highest waste rates. Students may prefer other cuisine types - consider diversifying the menu with more popular alternatives.`
            });
        }
    }
    
    // Insight 4: Efficiency recommendation
    if (totalFoodWaste > 20) {
        insights.push({
            icon: '✚',
            text: `With ${totalFoodWaste.toFixed(1)}kg of weekly food waste, implementing portion control and student feedback surveys could reduce waste by 15-20%.`
        });
    } else if (totalFoodWaste > 0) {
        insights.push({
            icon: '✓',
            text: `Food waste levels are relatively low at ${totalFoodWaste.toFixed(1)}kg per week. Continue monitoring to maintain this efficiency.`
        });
    }
    
    // Insight 5: Top performers
    if (wastedFoods.length > 3) {
        const leastWasted = wastedFoods[wastedFoods.length - 1];
        insights.push({
            icon: '☆',
            text: `${leastWasted.name} has the lowest waste among tracked dishes (${leastWasted.totalWaste.toFixed(1)}kg). Consider serving similar ${leastWasted.type} dishes more frequently.`
        });
    }
    
    return insights.slice(0, 4); // Return top 4 insights
}

// Update all insights displays
function updateInsightsDisplay() {
    updateMostWastedFoodsDisplay();
    generateFoodWasteInsights();
}

function getDishRecommendations() {
  const unpopularDishes = getUnpopularDishes();
  const popularDishes = getPopularDishes();
  const recommendations = [];
  
  if (unpopularDishes.length > 0) {
    const worstDish = unpopularDishes[0];
    recommendations.push({
      type: 'replace',
      dish: worstDish.dish,
      mess: worstDish.mess,
      avgWaste: worstDish.avgWastePerServing.toFixed(1),
      suggestion: `Consider replacing ${worstDish.dish} (${worstDish.avgWastePerServing.toFixed(1)}kg avg waste) with alternative dishes`
    });
  }
  
  if (popularDishes.length > 0) {
    const bestDish = popularDishes[0];
    recommendations.push({
      type: 'promote',
      dish: bestDish.dish,
      mess: bestDish.mess,
      avgWaste: bestDish.avgWastePerServing.toFixed(1),
      suggestion: `${bestDish.dish} is popular (${bestDish.avgWastePerServing.toFixed(1)}kg avg waste) - consider serving more frequently`
    });
  }
  
  return recommendations;
}
function getWeeklyData() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const weeklyWaste = wasteData.filter(entry => new Date(entry.timestamp) >= oneWeekAgo);
  
  return {
    food: weeklyWaste.filter(w => w.type === 'food').reduce((sum, w) => sum + w.weight, 0),
    plastic: weeklyWaste.filter(w => w.type === 'plastic').reduce((sum, w) => sum + w.weight, 0),
    misc: weeklyWaste.filter(w => w.type === 'misc').reduce((sum, w) => sum + w.weight, 0)
  };
}

function getTopWasteGenerators() {
  const hostelTotals = {};
  
  wasteData.forEach(entry => {
    if (entry.hostel) {
      hostelTotals[entry.hostel] = (hostelTotals[entry.hostel] || 0) + entry.weight;
    }
  });
  
  return Object.entries(hostelTotals)
    .map(([hostel, amount]) => ({
      name: hostel, // Just use the hostel name directly
      amount
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}

function getMessWasteData() {
  const messData = {};
  
  // Initialize all messes with 0
  Object.keys(messes).forEach(mess => {
    messData[mess] = 0;
  });
  
  // Calculate totals
  wasteData.forEach(entry => {
    if (entry.mess && entry.type === 'food') {
      messData[entry.mess] += entry.weight;
    }
  });
  
  return messData;
}

async function generateInsights() {
  const insights = [];
  const weekData = getWeeklyData();
  const totalWaste = weekData.food + weekData.plastic + weekData.misc;
  
  if (totalWaste === 0) {
    return [{
      icon: 'ℹ',
      text: 'Start collecting waste data to generate insights about waste patterns.'
    }];
  }

  // Generate insights based on data patterns
  insights.push(...getManualInsights());

  return insights.slice(0, 4); // Limit to 4 insights
}

function getManualInsights() {
  const insights = [];
  const weekData = getWeeklyData();
  const totalWaste = weekData.food + weekData.plastic + weekData.misc;
  
  if (totalWaste === 0) return insights;
  
  // Food waste insights
  if (weekData.food > 0) {
    const foodPercentage = (weekData.food / totalWaste * 100).toFixed(1);
    insights.push({
      icon: '🍽️',
      text: `Food waste accounts for ${foodPercentage}% of total waste this week. Consider portion control strategies.`
    });
    
    // Check for highest waste days
    const dayWaste = analyzeWasteByDay();
    const highestDay = Object.entries(dayWaste).sort(([,a], [,b]) => b - a)[0];
    if (highestDay && highestDay[1] > 0) {
      insights.push({
        icon: '📅',
        text: `${highestDay[0]} has the highest food waste (${highestDay[1].toFixed(1)} kg). Review ${highestDay[0]}'s menu.`
      });
    }
  }
  
  // Mess comparison insights
  const messData = getMessWasteData();
  const highestMess = Object.entries(messData).sort(([,a], [,b]) => b - a)[0];
  if (highestMess && highestMess[1] > 0) {
    insights.push({
      icon: '🏢',
      text: `${messes[highestMess[0]].name} generates the most food waste (${highestMess[1].toFixed(1)} kg). Consider menu optimization.`
    });
  }
  
  // Environmental impact
  const co2Impact = (weekData.food * 0.5 + weekData.plastic * 0.3 + weekData.misc * 0.2).toFixed(1);
  insights.push({
    icon: '🌍',
    text: `This week's waste generated approximately ${co2Impact} kg of CO₂ equivalent. Focus on reduction strategies.`
  });
  
  return insights;
}

function analyzeWasteByDay() {
  const dayWaste = {
    'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0,
    'Friday': 0, 'Saturday': 0, 'Sunday': 0
  };
  
  wasteData.forEach(entry => {
    if (entry.type === 'food') {
      const day = new Date(entry.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
      dayWaste[day] += entry.weight;
    }
  });
  
  return dayWaste;
}

// Data Persistence
function saveWasteData() {
  localStorage.setItem('klean-waste-data', JSON.stringify(wasteData));
}

function loadWasteData() {
  const saved = localStorage.getItem('klean-waste-data');
  if (saved) {
    wasteData = JSON.parse(saved);
    // Convert timestamp strings back to Date objects
    wasteData.forEach(entry => {
      entry.timestamp = new Date(entry.timestamp);
    });
  }
}

// Notification System
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 6000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: 'Roboto Mono', monospace;
    font-weight: 600;
    max-width: 300px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// ESP32 Dustbin Monitoring Functions
async function checkDustbinStatus() {
  try {
    const response = await fetch(`${DUSTBIN_API_BASE}/dustbin/status`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const dustbins = data.dustbins;
    lastDustbinSync = new Date(data.last_sync);
    
    // Process each dustbin
    Object.values(dustbins).forEach(dustbin => {
      processDustbinUpdate(dustbin);
    });
    
    // Update sensor dustbins cache
    sensorDustbins = dustbins;
    
    // Update dashboard
    updateSensorDashboard();
    
    console.log('Dustbin status updated:', Object.keys(dustbins).length, 'dustbins');
    
  } catch (error) {
    console.error('Error checking dustbin status:', error);
    showDustbinNotification('Failed to sync with sensor dustbins', 'error');
  }
}

function processDustbinUpdate(dustbin) {
  const oldDustbin = sensorDustbins[dustbin.id];
  const statusChanged = oldDustbin && oldDustbin.status !== dustbin.status;
  
  // Handle status changes
  if (statusChanged) {
    handleDustbinStatusChange(dustbin, oldDustbin.status);
  }
  
  // Update or add marker on map
  updateDustbinMarker(dustbin);
}

function handleDustbinStatusChange(dustbin, oldStatus) {
  const newStatus = dustbin.status;
  
  console.log(`Dustbin ${dustbin.id} status changed: ${oldStatus} -> ${newStatus}`);
  
  if (newStatus === 'full') {
    // Auto-add to route
    addSensorDustbinToRoute(dustbin);
    showDustbinNotification(
      `🚨 Dustbin at ${dustbin.location.name} is full! Added to collection route.`,
      'warning'
    );
    
    // Play alert sound (optional)
    playAlertSound();
    
  } else if (oldStatus === 'full' && (newStatus === 'empty' || newStatus === 'partial')) {
    // Auto-remove from route
    removeSensorDustbinFromRoute(dustbin);
    showDustbinNotification(
      `✅ Dustbin at ${dustbin.location.name} has been emptied.`,
      'success'
    );
  }
}

function addSensorDustbinToRoute(dustbin) {
  const point = {
    lat: dustbin.location.lat,
    lng: dustbin.location.lng,
    name: dustbin.location.name,
    type: 'sensor_dustbin',
    dustbin_id: dustbin.id,
    capacity: dustbin.capacity_percentage || 90
  };
  
  // Check if already in selectedPoints
  const existingIndex = selectedPoints.findIndex(p => 
    p.type === 'sensor_dustbin' && p.dustbin_id === dustbin.id
  );
  
  if (existingIndex === -1) {
    selectedPoints.push(point);
    
    // Add to wasteData for tracking
    const wasteEntry = {
      location: dustbin.location.name,
      type: 'mixed',
      weight: 15, // Estimated weight for full sensor dustbin
      volume: 50, // Estimated volume
      timestamp: new Date(),
      hostel: 'Sensor',
      mess: 'Automatic',
      day: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
      automatic: true,
      dustbin_id: dustbin.id
    };
    
    wasteData.push(wasteEntry);
    saveWasteData();
    
    // Recalculate route if we have multiple points
    if (selectedPoints.length > 1) {
      calculateRoute();
    }
    
    console.log(`Added sensor dustbin ${dustbin.id} to route`);
  }
}

function removeSensorDustbinFromRoute(dustbin) {
  // Remove from selectedPoints
  const pointIndex = selectedPoints.findIndex(p => 
    p.type === 'sensor_dustbin' && p.dustbin_id === dustbin.id
  );
  
  if (pointIndex !== -1) {
    selectedPoints.splice(pointIndex, 1);
    
    // Remove from wasteData
    const wasteIndex = wasteData.findIndex(entry => 
      entry.automatic && entry.dustbin_id === dustbin.id
    );
    
    if (wasteIndex !== -1) {
      wasteData.splice(wasteIndex, 1);
      saveWasteData();
    }
    
    // Remove marker
    const marker = sensorMarkers[dustbin.id];
    if (marker) {
      marker.remove();
      delete sensorMarkers[dustbin.id];
    }
    
    // Recalculate route if we still have points
    if (selectedPoints.length > 1) {
      calculateRoute();
    } else if (selectedPoints.length === 0) {
      // Clear route if no points left
      if (window.currentRoute) {
        window.currentRoute.remove();
        window.currentRoute = null;
      }
    }
    
    console.log(`Removed sensor dustbin ${dustbin.id} from route`);
  }
}

function updateDustbinMarker(dustbin) {
  const existingMarker = sensorMarkers[dustbin.id];
  
  // Remove existing marker
  if (existingMarker) {
    existingMarker.remove();
  }
  
  // Create new marker with updated status
  const marker = addSensorDustbinMarker(dustbin);
  sensorMarkers[dustbin.id] = marker;
}

function addSensorDustbinMarker(dustbin) {
  const { lat, lng, name } = dustbin.location;
  const status = dustbin.status;
  const capacity = dustbin.capacity_percentage || 0;
  const batteryLevel = dustbin.battery_level || 100;
  
  // Determine marker color and style based on status
  let markerColor, pulseClass;
  switch (status) {
    case 'full':
      markerColor = '#ff4444'; // Red for full
      pulseClass = 'pulse-red';
      break;
    case 'partial':
      markerColor = '#ffaa00'; // Orange for partial
      pulseClass = 'pulse-orange';
      break;
    case 'empty':
      markerColor = '#44ff44'; // Green for empty
      pulseClass = '';
      break;
    default:
      markerColor = '#888888'; // Gray for unknown
      pulseClass = '';
  }
  
  // Create custom sensor dustbin icon
  const sensorIcon = L.divIcon({
    className: `sensor-dustbin-marker ${pulseClass}`,
    html: `
      <div class="sensor-dustbin-icon" style="background-color: ${markerColor};">
        <div class="sensor-icon">📡</div>
        <div class="capacity-indicator">${capacity}%</div>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50]
  });
  
  const marker = L.marker([lat, lng], { icon: sensorIcon }).addTo(map);
  
  // Create detailed popup
  const popupContent = `
    <div class="sensor-dustbin-popup">
      <h3>🗑️ ${name}</h3>
      <div class="sensor-info">
        <div class="status-info">
          <span class="status-badge ${status}">${status.toUpperCase()}</span>
          <span class="capacity">${capacity}% Full</span>
        </div>
        <div class="sensor-details">
          <p><strong>Dustbin ID:</strong> ${dustbin.id}</p>
          <p><strong>Sensor Type:</strong> ${dustbin.sensor_type}</p>
          <p><strong>Battery:</strong> ${batteryLevel}%</p>
          <p><strong>Last Update:</strong> ${new Date(dustbin.last_updated).toLocaleString()}</p>
          <p><strong>Health:</strong> <span class="health-${dustbin.sensor_health}">${dustbin.sensor_health}</span></p>
        </div>
      </div>
      <div class="sensor-actions">
        ${status === 'full' ? 
          '<button onclick="simulateCollection(\'' + dustbin.id + '\')">Simulate Collection</button>' : 
          '<button onclick="simulateFullDustbin(\'' + dustbin.id + '\')">Simulate Full</button>'
        }
      </div>
    </div>
  `;
  
  marker.bindPopup(popupContent);
  
  return marker;
}

function startDustbinPolling() {
  console.log('Starting dustbin status polling...');
  
  // Initial check
  checkDustbinStatus();
  
  // Set up interval
  dustbinPollingInterval = setInterval(checkDustbinStatus, POLLING_INTERVAL);
  
  showDustbinNotification('🔄 Sensor dustbin monitoring started', 'success');
}

function stopDustbinPolling() {
  if (dustbinPollingInterval) {
    clearInterval(dustbinPollingInterval);
    dustbinPollingInterval = null;
    console.log('Dustbin polling stopped');
    showDustbinNotification('⏹️ Sensor dustbin monitoring stopped', 'info');
  }
}

function showDustbinNotification(message, type = 'info') {
  const notification = {
    id: Date.now(),
    message,
    type,
    timestamp: new Date()
  };
  
  dustbinNotifications.push(notification);
  
  // Create notification element
  const notificationEl = document.createElement('div');
  notificationEl.className = `dustbin-notification ${type}`;
  notificationEl.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <span class="notification-time">${notification.timestamp.toLocaleTimeString()}</span>
    </div>
    <button class="notification-close" onclick="closeDustbinNotification(${notification.id})">×</button>
  `;
  
  // Add to page
  const container = document.getElementById('notification-container') || createNotificationContainer();
  container.appendChild(notificationEl);
  
  // Auto-remove after duration
  setTimeout(() => {
    closeDustbinNotification(notification.id);
  }, NOTIFICATION_DURATION);
}

function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'notification-container';
  container.className = 'dustbin-notifications';
  document.body.appendChild(container);
  return container;
}

function closeDustbinNotification(notificationId) {
  const container = document.getElementById('notification-container');
  if (container) {
    const notification = container.querySelector(`[data-id="${notificationId}"]`);
    if (notification) {
      notification.remove();
    }
  }
  
  // Remove from array
  dustbinNotifications = dustbinNotifications.filter(n => n.id !== notificationId);
}

function playAlertSound() {
  // Create audio context for alert sound
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Could not play alert sound:', error);
  }
}

// Simulation functions for testing
async function simulateCollection(dustbinId) {
  try {
    const response = await fetch(`${DUSTBIN_API_BASE}/dustbin/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dustbin_id: dustbinId,
        status: 'empty'
      })
    });
    
    if (response.ok) {
      showDustbinNotification(`✅ Simulated collection for dustbin ${dustbinId}`, 'success');
    }
  } catch (error) {
    console.error('Error simulating collection:', error);
  }
}

async function simulateFullDustbin(dustbinId) {
  try {
    const response = await fetch(`${DUSTBIN_API_BASE}/dustbin/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dustbin_id: dustbinId,
        status: 'full'
      })
    });
    
    if (response.ok) {
      showDustbinNotification(`🚨 Simulated full dustbin ${dustbinId}`, 'warning');
    }
  } catch (error) {
    console.error('Error simulating full dustbin:', error);
  }
}

// Sensor Dashboard Management Functions
function updateSensorDashboard() {
  const fullCount = Object.values(sensorDustbins).filter(d => d.status === 'full').length;
  const partialCount = Object.values(sensorDustbins).filter(d => d.status === 'partial').length;
  const emptyCount = Object.values(sensorDustbins).filter(d => d.status === 'empty').length;
  
  // Update counters
  const fullCountEl = document.getElementById('full-count');
  const partialCountEl = document.getElementById('partial-count');
  const emptyCountEl = document.getElementById('empty-count');
  
  if (fullCountEl) fullCountEl.textContent = fullCount;
  if (partialCountEl) partialCountEl.textContent = partialCount;
  if (emptyCountEl) emptyCountEl.textContent = emptyCount;
  
  // Update sync time
  const lastSyncEl = document.getElementById('last-sync');
  if (lastSyncEl && lastDustbinSync) {
    lastSyncEl.textContent = `Last sync: ${lastDustbinSync.toLocaleTimeString()}`;
  }
  
  // Update monitoring button
  const toggleBtn = document.getElementById('toggle-monitoring-btn');
  if (toggleBtn) {
    toggleBtn.textContent = dustbinPollingInterval ? 'Stop Monitoring' : 'Start Monitoring';
    toggleBtn.className = dustbinPollingInterval ? 'sensor-control-btn active' : 'sensor-control-btn';
  }
}

function toggleDustbinMonitoring() {
  if (dustbinPollingInterval) {
    stopDustbinPolling();
  } else {
    startDustbinPolling();
  }
  updateSensorDashboard();
}

function testSensorNotification() {
  showDustbinNotification('🧪 Test notification - ESP32 system working!', 'info');
  playAlertSound();
}

// Add event listeners for modal interactions
document.addEventListener('DOMContentLoaded', function() {
  // Waste type buttons
  document.querySelectorAll('.waste-type-btn').forEach(btn => {
    btn.addEventListener('click', () => selectWasteType(btn.dataset.type));
  });
  
  // Hostel buttons
  document.querySelectorAll('.hostel-btn').forEach(btn => {
    btn.addEventListener('click', () => selectHostel(btn.dataset.hostel));
  });
  
  // Mess buttons
  document.querySelectorAll('.mess-btn').forEach(btn => {
    btn.addEventListener('click', () => selectMess(btn.dataset.mess));
  });
  
  // Modal navigation buttons
  document.getElementById('modal-back-btn').addEventListener('click', previousStep);
  document.getElementById('modal-next-btn').addEventListener('click', nextStep);
  document.getElementById('modal-submit-btn').addEventListener('click', submitWasteData);
  
  // Modal close buttons
  document.getElementById('close-waste-modal').addEventListener('click', closeWasteModal);
  document.getElementById('close-analytics').addEventListener('click', closeAnalytics);
  
  // Analytics panel button
  document.getElementById('analytics-btn').addEventListener('click', openAnalytics);
  
  // Load waste data on page load
  loadWasteData();
  
  // Auto-update analytics after loading data
  setTimeout(() => {
    updateAnalytics();
  }, 500);
  
  // Initialize ESP32 dustbin monitoring
  setTimeout(() => {
    startDustbinPolling();
    updateSensorDashboard();
  }, 1000);
});

// Add CSS for notification animations
const notificationCSS = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationCSS;
document.head.appendChild(styleSheet);