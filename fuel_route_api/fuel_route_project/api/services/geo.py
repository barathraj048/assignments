"""
Geographical utilities:
- Haversine distance between two lat/lng points
- Sample waypoints along a polyline every N miles
"""
import math
from typing import List, Tuple

EARTH_RADIUS_MILES = 3958.8


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return distance in miles between two lat/lng points."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_MILES * math.asin(math.sqrt(a))


def polyline_length(coords: List[List[float]]) -> float:
    """Total length of a polyline (list of [lng, lat]) in miles."""
    total = 0.0
    for i in range(1, len(coords)):
        total += haversine(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0])
    return total


def sample_waypoints_every_n_miles(
    coords: List[List[float]], interval_miles: float
) -> List[Tuple[float, float, float]]:
    """
    Walk the polyline and return waypoints every `interval_miles`.
    Each waypoint is (lat, lng, cumulative_distance_miles).
    Does NOT include start; DOES include end.
    """
    waypoints = []
    cumulative = 0.0
    next_stop = interval_miles

    for i in range(1, len(coords)):
        prev = coords[i - 1]
        curr = coords[i]
        seg_dist = haversine(prev[1], prev[0], curr[1], curr[0])

        while cumulative + seg_dist >= next_stop:
            # Interpolate the exact point along this segment
            ratio = (next_stop - cumulative) / seg_dist
            interp_lng = prev[0] + ratio * (curr[0] - prev[0])
            interp_lat = prev[1] + ratio * (curr[1] - prev[1])
            waypoints.append((interp_lat, interp_lng, next_stop))
            next_stop += interval_miles

        cumulative += seg_dist

    # Always add the destination
    end = coords[-1]
    waypoints.append((end[1], end[0], cumulative))
    return waypoints
