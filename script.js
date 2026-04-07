
// OpenWeatherMap API Key - Get free key from https://openweathermap.org/api
// Replace with your actual API key
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();
    displayRecentSearches();
});

// DOM Elements
const locationInput = document.getElementById('locationInput');
const searchBtn = document.getElementById('searchBtn');
const getCurrentLocationBtn = document.getElementById('getCurrentLocationBtn');
const voiceInputBtn = document.getElementById('voiceInputBtn');
const voiceOutputBtn = document.getElementById('voiceOutputBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const recentSearches = document.getElementById('recentSearches');
const recentList = document.getElementById('recentList');
const clearRecentBtn = document.getElementById('clearRecentBtn');
const voiceStatus = document.getElementById('voiceStatus');
const weatherSection = document.getElementById('weatherSection');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');

// Voice recognition and synthesis
let recognition = null;
let synth = window.speechSynthesis;

// Recent searches storage
let recentLocations = JSON.parse(localStorage.getItem('recentLocations')) || [];

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
getCurrentLocationBtn.addEventListener('click', handleCurrentLocation);
voiceInputBtn.addEventListener('click', handleVoiceInput);
voiceOutputBtn.addEventListener('click', handleVoiceOutput);
darkModeToggle.addEventListener('click', toggleDarkMode);
clearRecentBtn.addEventListener('click', clearRecentSearches);
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
locationInput.addEventListener('focus', showRecentSearches);
locationInput.addEventListener('blur', hideRecentSearches);

/**
 * Handle manual location search
 */
function handleSearch() {
    // Stop voice recognition if active
    if (recognition && recognition.continuous) {
        recognition.stop();
    }

    const location = locationInput.value.trim();
    if (location) {
        fetchWeatherByLocation(location);
    } else {
        showError('Please enter a city name');
    }
}

/**
 * Get user's current location
 */
function handleCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    showLoading(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoordinates(latitude, longitude);
        },
        (error) => {
            showLoading(false);
            showError('Unable to get your location. Please enable location access or search manually.');
            console.error('Geolocation error:', error);
        }
    );
}

/**
 * Fetch weather by city name
 */
function fetchWeatherByLocation(location) {
    showLoading(true);
    clearError();

    const url = `${API_URL}?q=${location}&appid=${API_KEY}&units=metric`;

    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Location not found');
            }
            return response.json();
        })
        .then((data) => {
            displayWeather(data);
            addToRecentSearches(location);
            showLoading(false);
        })
        .catch((error) => {
            showLoading(false);
            showError('Could not fetch weather data. Check the location and try again.');
            console.error('Error:', error);
        });
}

/**
 * Fetch weather by coordinates
 */
function fetchWeatherByCoordinates(lat, lon) {
    showLoading(true);
    clearError();

    const url = `${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            displayWeather(data);            addToRecentSearches(`${data.name}, ${data.sys.country}`);            showLoading(false);
        })
        .catch((error) => {
            showLoading(false);
            showError('Could not fetch weather data.');
            console.error('Error:', error);
        });
}

/**
 * Handle voice input
 */
function handleVoiceInput() {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showError('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        voiceStatus.textContent = '🎤 Listening... Say a city name';
        voiceStatus.className = 'voice-status listening';
        voiceInputBtn.disabled = true;
        voiceInputBtn.innerHTML = '⏹️';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        locationInput.value = transcript;
        voiceStatus.textContent = `🎤 Heard: "${transcript}"`;
        handleSearch();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        showError('Voice recognition failed. Please try again or type manually.');
        resetVoiceInput();
    };

    recognition.onend = () => {
        resetVoiceInput();
    };

    recognition.start();
}

/**
 * Reset voice input UI
 */
function resetVoiceInput() {
    voiceStatus.className = 'voice-status hidden';
    voiceInputBtn.disabled = false;
    voiceInputBtn.innerHTML = '🎤';
}

/**
 * Handle voice output
 */
function handleVoiceOutput() {
    if (synth.speaking) {
        synth.cancel();
        resetVoiceOutput();
        return;
    }

    if (!weatherSection.classList.contains('hidden')) {
        speakWeatherInfo();
    } else {
        showError('Please get weather information first before using voice output.');
    }
}

/**
 * Speak weather information and outfit suggestions
 */
function speakWeatherInfo() {
    if (synth.speaking) {
        synth.cancel();
        resetVoiceOutput();
        return;
    }

    const location = document.getElementById('locationName').textContent;
    const temperature = document.getElementById('temperature').textContent;
    const description = document.getElementById('weatherDescription').textContent;
    const feelsLike = document.getElementById('feelsLike').textContent;
    const humidity = document.getElementById('humidity').textContent;
    const windSpeed = document.getElementById('windSpeed').textContent;

    const outfitItems = document.querySelectorAll('.outfit-item');
    let outfitText = '';
    outfitItems.forEach(item => {
        const category = item.querySelector('strong').textContent;
        const items = item.querySelector('p').textContent;
        outfitText += `${category}: ${items}. `;
    });

    const speechText = `Weather for ${location}. Temperature is ${temperature} degrees Celsius. ${description}. ${feelsLike}. Humidity is ${humidity}. Wind speed is ${windSpeed} kilometers per hour. Outfit suggestions: ${outfitText}`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => {
        voiceStatus.textContent = '🔊 Speaking weather information...';
        voiceStatus.className = 'voice-status speaking';
        voiceOutputBtn.innerHTML = '⏹️';
    };

    utterance.onend = () => {
        resetVoiceOutput();
    };

    utterance.onerror = () => {
        resetVoiceOutput();
        showError('Speech synthesis failed.');
    };

    synth.speak(utterance);
}

/**
 * Reset voice output UI
 */
function resetVoiceOutput() {
    voiceStatus.className = 'voice-status hidden';
    voiceOutputBtn.innerHTML = '🔊';
}

/**
 * Initialize dark mode based on saved preference
 */
function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '☀️';
    } else {
        darkModeToggle.innerHTML = '🌙';
    }
}

/**
 * Toggle between light and dark mode
 */
function toggleDarkMode() {
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
        document.body.classList.remove('dark-mode');
        darkModeToggle.innerHTML = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

/**
 * Add location to recent searches
 */
function addToRecentSearches(location) {
    // Remove if already exists
    recentLocations = recentLocations.filter(loc => loc.toLowerCase() !== location.toLowerCase());
    
    // Add to beginning of array
    recentLocations.unshift(location);
    
    // Keep only last 5 searches
    if (recentLocations.length > 5) {
        recentLocations = recentLocations.slice(0, 5);
    }
    
    // Save to localStorage
    localStorage.setItem('recentLocations', JSON.stringify(recentLocations));
    
    // Update display
    displayRecentSearches();
}

/**
 * Display recent searches
 */
function displayRecentSearches() {
    if (recentLocations.length === 0) {
        recentSearches.classList.add('hidden');
        return;
    }
    
    recentSearches.classList.remove('hidden');
    recentList.innerHTML = '';
    
    recentLocations.forEach(location => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.textContent = location;
        item.addEventListener('click', () => {
            locationInput.value = location;
            handleSearch();
        });
        recentList.appendChild(item);
    });
}

/**
 * Clear recent searches
 */
function clearRecentSearches() {
    recentLocations = [];
    localStorage.removeItem('recentLocations');
    displayRecentSearches();
}

/**
 * Show recent searches when input is focused
 */
function showRecentSearches() {
    if (recentLocations.length > 0) {
        recentSearches.classList.remove('hidden');
    }
}

/**
 * Hide recent searches when input loses focus
 */
function hideRecentSearches() {
    // Delay hiding to allow clicking on recent items
    setTimeout(() => {
        recentSearches.classList.add('hidden');
    }, 150);
}

/**
 * Display weather information
 */
function displayWeather(data) {
    const { name, sys, main, weather, wind } = data;
    const temp = Math.round(main.temp);
    const feelsLike = Math.round(main.feels_like);
    const humidity = main.humidity;
    const windSpeed = Math.round(wind.speed);
    const description = weather[0].main;
    const icon = weather[0].icon;

    // Update location and date
    document.getElementById('locationName').textContent = `${name}, ${sys.country}`;
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update weather details
    document.getElementById('temperature').textContent = temp;
    document.getElementById('weatherDescription').textContent = description;
    document.getElementById('feelsLike').textContent = `Feels like ${feelsLike}°C`;
    document.getElementById('humidity').textContent = `${humidity}%`;
    document.getElementById('windSpeed').textContent = `${windSpeed} km/h`;
    document.getElementById('feelsLikeTemp').textContent = `${feelsLike}°C`;

    // Generate outfit suggestions
    generateOutfitSuggestions(temp, humidity, windSpeed, description);

    // Reset voice output button
    resetVoiceOutput();

    // Show weather section
    weatherSection.classList.remove('hidden');
}

/**
 * Generate outfit suggestions based on weather
 */
function generateOutfitSuggestions(temp, humidity, windSpeed, weatherType) {
    const suggestions = [];

    // Temperature-based suggestions
    if (temp <= 0) {
        suggestions.push({
            category: '🧥 Heavy Outerwear',
            items: 'Thick winter coat, thermal layers, heavy boots'
        });
        suggestions.push({
            category: '🧤 Accessories',
            items: 'Warm hat, gloves, scarf, insulated socks'
        });
    } else if (temp > 0 && temp < 10) {
        suggestions.push({
            category: '🧥 Cold Weather Coat',
            items: 'Winter jacket or heavy sweater, long pants'
        });
        suggestions.push({
            category: '🧣 Warm Accessories',
            items: 'Scarf, light gloves, closed-toe shoes'
        });
    } else if (temp >= 10 && temp < 15) {
        suggestions.push({
            category: '🧥 Light Jacket',
            items: 'Light jacket, sweater, or cardigan, jeans'
        });
        suggestions.push({
            category: '👟 Footwear',
            items: 'Comfortable shoes, closed-toe shoes'
        });
    } else if (temp >= 15 && temp < 20) {
        suggestions.push({
            category: '👕 Layering',
            items: 'T-shirt with light jacket, long pants or jeans'
        });
        suggestions.push({
            category: '👟 Footwear',
            items: 'Comfortable sneakers or casual shoes'
        });
    } else if (temp >= 20 && temp < 25) {
        suggestions.push({
            category: '👕 Comfortable Clothes',
            items: 'T-shirt, short-sleeve shirt, shorts or lightweight pants'
        });
        suggestions.push({
            category: '🕶️ Sun Protection',
            items: 'Sunglasses, hat, sunscreen'
        });
    } else if (temp >= 25 && temp < 30) {
        suggestions.push({
            category: '👕 Summer Wear',
            items: 'Light t-shirt, tank top, shorts, skirt'
        });
        suggestions.push({
            category: '☀️ Sun Essentials',
            items: 'Sunglasses, cap, flip-flops, sandals, sunscreen'
        });
    } else {
        suggestions.push({
            category: '👕 Very Light Clothing',
            items: 'Minimal clothing, tank top, shorts, light dress'
        });
        suggestions.push({
            category: '☀️ Maximum Sun Protection',
            items: 'Sunglasses, wide-brimmed hat, sandals, high SPF sunscreen'
        });
    }

    // Weather type suggestions
    if (weatherType.includes('Rain') || weatherType.includes('Drizzle')) {
        suggestions.push({
            category: '🌧️ Rain Gear',
            items: 'Waterproof jacket, rain boots, umbrella'
        });
    }

    if (weatherType.includes('Snow')) {
        suggestions.push({
            category: '❄️ Snow Gear',
            items: 'Thick winter coat, snow boots, thermal underwear, mittens'
        });
    }

    if (weatherType.includes('Clear') || weatherType.includes('Sunny')) {
        suggestions.push({
            category: '☀️ Bright Day Essentials',
            items: 'Sunglasses, sunhat, light breathable clothing'
        });
    }

    if (weatherType.includes('Cloud')) {
        suggestions.push({
            category: '☁️ Cloudy Day',
            items: 'Comfortable casual clothing, light jacket optional'
        });
    }

    // Humidity suggestion
    if (humidity > 70) {
        suggestions.push({
            category: '💧 High Humidity',
            items: 'Breathable fabrics (cotton, linen), light and loose clothing'
        });
    }

    // Wind suggestion
    if (windSpeed > 30) {
        suggestions.push({
            category: '💨 Windy Conditions',
            items: 'Secure your hat, fitted clothing to avoid wind exposure'
        });
    }

    // Display suggestions
    displayOutfitList(suggestions);
}

/**
 * Display outfit suggestions in the DOM
 */
function displayOutfitList(suggestions) {
    const outfitList = document.getElementById('outfitList');
    outfitList.innerHTML = '';

    suggestions.forEach((suggestion) => {
        const outfitItem = document.createElement('div');
        outfitItem.className = 'outfit-item';
        outfitItem.innerHTML = `
            <strong>${suggestion.category}</strong>
            <p>${suggestion.items}</p>
        `;
        outfitList.appendChild(outfitItem);
    });
}

/**
 * Show loading spinner
 */
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        loadingSpinner.innerHTML = '';
        loadingSpinner.appendChild(spinner);
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

/**
 * Show error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

/**
 * Clear error message
 */
function clearError() {
    errorMessage.classList.add('hidden');
    errorMessage.textContent = '';
    voiceStatus.className = 'voice-status hidden';
}