"""
Fuel station lookup and cost calculation.
Uses in-DB Haversine approximation to find cheapest nearby station.
"""
from django.db import connection
from django.conf import settings

from api.models import FuelStation


def find_cheapest_station_near(lat: float, lng: float, radius_miles: float = None) -> FuelStation | None:
    """
    Find the cheapest fuel station within radius_miles of (lat, lng).
    Uses a bounding-box pre-filter then exact Haversine in Python for accuracy.
    """
    if radius_miles is None:
        radius_miles = settings.FUEL_SEARCH_RADIUS_MILES

    # Bounding box (1 degree lat ≈ 69 miles, 1 degree lng ≈ 69*cos(lat) miles)
    import math
    lat_delta = radius_miles / 69.0
    lng_delta = radius_miles / (69.0 * math.cos(math.radians(lat)))

    candidates = FuelStation.objects.filter(
        lat__isnull=False,
        lng__isnull=False,
        lat__gte=lat - lat_delta,
        lat__lte=lat + lat_delta,
        lng__gte=lng - lng_delta,
        lng__lte=lng + lng_delta,
    )

    best = None
    best_price = float("inf")

    from api.services.geo import haversine
    for station in candidates:
        dist = haversine(lat, lng, station.lat, station.lng)
        if dist <= radius_miles and station.retail_price < best_price:
            best = station
            best_price = station.retail_price

    return best


def calculate_fuel_cost(distance_miles: float, price_per_gallon: float, mpg: float = None) -> dict:
    """Calculate gallons needed and total cost for a segment."""
    if mpg is None:
        mpg = settings.VEHICLE_MPG
    gallons = distance_miles / mpg
    cost = gallons * price_per_gallon
    return {"gallons": round(gallons, 3), "cost": round(cost, 2)}


def plan_fuel_stops(route_coords: list, total_distance_miles: float) -> dict:
    """
    Given the route polyline and total distance, plan all fuel stops.
    Returns list of stops and total fuel cost.
    """
    from api.services.geo import sample_waypoints_every_n_miles
    interval = settings.FUEL_STOP_INTERVAL_MILES
    mpg = settings.VEHICLE_MPG

    waypoints = sample_waypoints_every_n_miles(route_coords, interval)

    stops = []
    total_cost = 0.0
    total_gallons = 0.0
    prev_distance = 0.0

    for i, (wp_lat, wp_lng, cum_dist) in enumerate(waypoints):
        is_destination = i == len(waypoints) - 1

        if is_destination:
            # Final segment — no refuel needed at destination
            break

        segment_miles = cum_dist - prev_distance
        station = find_cheapest_station_near(wp_lat, wp_lng)

        if station is None:
            # Widen search radius if nothing found
            station = find_cheapest_station_near(wp_lat, wp_lng, radius_miles=100)

        fuel = calculate_fuel_cost(segment_miles, station.retail_price if station else 3.50)
        total_cost += fuel["cost"]
        total_gallons += fuel["gallons"]

        stop = {
            "stop_number": i + 1,
            "waypoint_lat": round(wp_lat, 6),
            "waypoint_lng": round(wp_lng, 6),
            "miles_since_last_stop": round(segment_miles, 1),
            "cumulative_miles": round(cum_dist, 1),
            "gallons_to_fill": fuel["gallons"],
            "stop_cost_usd": fuel["cost"],
        }

        if station:
            stop.update({
                "station_id": station.opis_id,
                "station_name": station.name.strip(),
                "station_address": station.address.strip(),
                "station_city": station.city.strip(),
                "station_state": station.state.strip(),
                "station_lat": station.lat,
                "station_lng": station.lng,
                "price_per_gallon": round(station.retail_price, 3),
            })
        else:
            stop.update({
                "station_name": "No station found in range",
                "price_per_gallon": 3.50,
            })

        stops.append(stop)
        prev_distance = cum_dist

    # Final segment cost (from last stop to destination)
    final_miles = total_distance_miles - prev_distance
    if final_miles > 0:
        avg_price = (sum(s["price_per_gallon"] for s in stops) / len(stops)) if stops else 3.50
        final_fuel = calculate_fuel_cost(final_miles, avg_price)
        total_cost += final_fuel["cost"]
        total_gallons += final_fuel["gallons"]

    return {
        "fuel_stops": stops,
        "total_gallons": round(total_gallons, 2),
        "total_fuel_cost_usd": round(total_cost, 2),
    }
