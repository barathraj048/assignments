# Fuel Route API

A Django REST API that calculates optimal fuel stops for a road trip across the USA.

## Features
- Takes start and end locations within the USA
- Returns optimal fuel stops based on **cheapest price** along the route
- Vehicle range: 500 miles | MPG: 10
- Returns a GeoJSON route map + total fuel cost
- Uses **OpenRouteService** (free) for routing — minimal API calls per request

## API Calls per Request
| Call | Purpose |
|------|---------|
| ORS geocode (start) | Convert start city to lat/lng |
| ORS geocode (end) | Convert end city to lat/lng |
| ORS directions | Get full route polyline |
| **Total: 3 calls** | Fuel stops computed offline from DB |

## Setup

### 1. Get a Free ORS API Key
Sign up at https://openrouteservice.org/dev/#/signup (free, no credit card)

### 2. Install & Configure
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your ORS_API_KEY
```

### 3. Set up Database
```bash
python manage.py migrate
python manage.py load_fuel_data --csv /path/to/fuel-prices-for-be-assessment.csv
```

### 4. Run Server
```bash
python manage.py runserver
```

## API Reference

### POST `/api/route/`
Plan a road trip with optimal fuel stops.

**Request:**
```json
{
  "start": "New York, NY",
  "end": "Los Angeles, CA"
}
```

**Response:**
```json
{
  "summary": {
    "start": "New York, NY",
    "end": "Los Angeles, CA",
    "total_distance_miles": 2789.4,
    "estimated_drive_time": "40h 12m",
    "vehicle_range_miles": 500,
    "vehicle_mpg": 10,
    "total_fuel_stops": 6,
    "total_gallons": 278.94,
    "total_fuel_cost_usd": 923.45
  },
  "fuel_stops": [
    {
      "stop_number": 1,
      "waypoint_lat": 40.712776,
      "waypoint_lng": -74.005974,
      "miles_since_last_stop": 400.0,
      "cumulative_miles": 400.0,
      "gallons_to_fill": 40.0,
      "stop_cost_usd": 132.80,
      "station_name": "LOVES TRAVEL STOP #123",
      "station_address": "I-80, EXIT 45",
      "station_city": "Columbus",
      "station_state": "OH",
      "station_lat": 39.9612,
      "station_lng": -82.9988,
      "price_per_gallon": 3.320
    }
  ],
  "route": {
    "type": "FeatureCollection",
    "features": [...]
  }
}
```

### GET `/api/health/`
Check API health and number of fuel stations loaded.

## Algorithm
1. Geocode start & end locations using ORS
2. Fetch full driving route from ORS (single call, returns complete polyline)
3. Sample the polyline every **400 miles** (safe buffer below 500-mile tank limit)
4. At each waypoint, query the DB for the **cheapest fuel station within 50 miles**
5. Calculate gallons needed per segment × price = cost
6. Return everything in one JSON response

## Architecture
```
api/
├── views.py              # RouteView — main endpoint
├── models.py             # FuelStation model
├── services/
│   ├── routing.py        # ORS geocoding + directions
│   ├── fuel.py           # Station lookup + cost calc
│   └── geo.py            # Haversine + polyline sampling
└── management/commands/
    └── load_fuel_data.py # CSV → DB loader (run once)
```
