
// OpenWeatherMap API Key - Get free key from https://openweathermap.org/api
const API_KEY = 'dd06a1831cdb50e044d6a3ab13ad48e2'; // Replace with your actual API key
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM Elements
const locationInput = document.getElementById('locationInput');
const searchBtn = document.getElementById('searchBtn');
const getCurrentLocationBtn = document.getElementById('getCurrentLocationBtn');
const weatherSection = document.getElementById('weatherSection');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
getCurrentLocationBtn.addEventListener('click', handleCurrentLocation);
locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

/**
 * Handle manual location search
 */
function handleSearch() {
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
            displayWeather(data);
            showLoading(false);
        })
        .catch((error) => {
            showLoading(false);
            showError('Could not fetch weather data.');
            console.error('Error:', error);
        });
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
}