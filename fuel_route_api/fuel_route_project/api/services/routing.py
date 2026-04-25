"""
OpenRouteService integration.
Docs: https://openrouteservice.org/dev/#/api-docs/v2/directions/{profile}/geojson/post
Free tier: 2000 req/day, 40 req/min — more than enough.
One API call returns full polyline + distance.
"""
import requests
from django.conf import settings


ORS_BASE = "https://api.openrouteservice.org"


def geocode_location(query: str) -> tuple[float, float]:
    """
    Convert a place name / address to (lat, lng) using ORS geocoding.
    Returns (lat, lng).
    """
    url = f"{ORS_BASE}/geocode/search"
    params = {
        "api_key": settings.ORS_API_KEY,
        "text": query,
        "boundary.country": "US",
        "size": 1,
    }
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    features = data.get("features", [])
    if not features:
        raise ValueError(f"Could not geocode location: '{query}'")
    coords = features[0]["geometry"]["coordinates"]  # [lng, lat]
    return coords[1], coords[0]  # lat, lng


def get_route(start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> dict:
    """
    Get driving route from ORS.
    Returns dict with:
        - coordinates: list of [lng, lat]
        - distance_miles: float
        - duration_seconds: float
    Single API call.
    """
    url = f"{ORS_BASE}/v2/directions/driving-car/geojson"
    headers = {
        "Authorization": settings.ORS_API_KEY,
        "Content-Type": "application/json",
    }
    body = {
        "coordinates": [[start_lng, start_lat], [end_lng, end_lat]],
        "instructions": False,
        "geometry_simplify": False,
    }
    resp = requests.post(url, json=body, headers=headers, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    feature = data["features"][0]
    coords = feature["geometry"]["coordinates"]  # list of [lng, lat]
    summary = feature["properties"]["summary"]
    distance_meters = summary["distance"]
    duration_seconds = summary["duration"]

    return {
        "coordinates": coords,
        "distance_miles": distance_meters * 0.000621371,
        "duration_seconds": duration_seconds,
        "geojson": data,
    }
