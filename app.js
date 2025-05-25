
// app.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize map
    const map = L.map('map').setView([20.5937, 78.9629], 5); // Center of India

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize variables
    let markers = [];
    let routingControl = null;
    const loadingElement = document.getElementById('loading');
    const routeInfoElement = document.getElementById('route-info');

    // Function to get coordinates from location name using OpenStreetMap Nominatim API
    async function getCoordinates(locationName) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`);
            const data = await response.json();
            if (data.length > 0) {
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }
            throw new Error('Location not found');
        } catch (error) {
            alert(`Could not find location: ${locationName}`);
            return null;
        }
    }

    // Function to update route information
    function updateRouteInfo(route) {
        const distance = (route.summary.totalDistance / 1000).toFixed(1);
        const duration = (route.summary.totalTime / 3600).toFixed(1);
        
        document.getElementById('distance').textContent = `${distance} km`;
        document.getElementById('duration').textContent = `${duration} hrs`;
        document.getElementById('route-name').textContent = 'Best Available';
        routeInfoElement.classList.remove('hidden');
    }

    // Function to clear existing route and markers
    function clearRoute() {
        if (routingControl) {
            map.removeControl(routingControl);
            routingControl = null;
        }
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
    }

    // Function to calculate and display route
    async function findRoute() {
        const originInput = document.getElementById('origin').value;
        const destinationInput = document.getElementById('destination').value;

        if (!originInput || !destinationInput) {
            alert('Please enter both origin and destination locations');
            return;
        }

        loadingElement.classList.remove('hidden');
        clearRoute();

        try {
            const originCoords = await getCoordinates(originInput);
            const destCoords = await getCoordinates(destinationInput);

            if (!originCoords || !destCoords) {
                loadingElement.classList.add('hidden');
                return;
            }

            // Add markers
            const originMarker = L.marker(originCoords).addTo(map);
            const destMarker = L.marker(destCoords).addTo(map);
            markers.push(originMarker, destMarker);

            // Create routing control
            routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(originCoords[0], originCoords[1]),
                    L.latLng(destCoords[0], destCoords[1])
                ],
                routeWhileDragging: false,
                showAlternatives: false,
                lineOptions: {
                    styles: [{ color: '#1e3c72', weight: 4 }]
                }
            }).addTo(map);

            // Update route information when route is calculated
            routingControl.on('routesfound', function(e) {
                updateRouteInfo(e.routes[0]);
                loadingElement.classList.add('hidden');
            });

        } catch (error) {
            alert('Error calculating route. Please try again.');
            loadingElement.classList.add('hidden');
        }
    }

    // Event listeners
    document.getElementById('find-route').addEventListener('click', findRoute);

    // Get user's current location
    function getCurrentLocation(inputId) {
        if (navigator.geolocation) {
            loadingElement.classList.remove('hidden');
            navigator.geolocation.getCurrentPosition(
                async function(position) {
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
                        );
                        const data = await response.json();
                        document.getElementById(inputId).value = data.display_name;
                        loadingElement.classList.add('hidden');
                    } catch (error) {
                        alert('Error getting location name');
                        loadingElement.classList.add('hidden');
                    }
                },
                function(error) {
                    alert('Error getting current location');
                    loadingElement.classList.add('hidden');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    }

    document.getElementById('locate-origin').addEventListener('click', () => getCurrentLocation('origin'));
    document.getElementById('locate-destination').addEventListener('click', () => getCurrentLocation('destination'));
});