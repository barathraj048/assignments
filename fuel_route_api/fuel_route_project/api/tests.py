"""
Tests for the Fuel Route API.
Run with: python manage.py test api
"""
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from api.models import FuelStation
from api.services.geo import haversine, polyline_length, sample_waypoints_every_n_miles
from api.services.fuel import find_cheapest_station_near, calculate_fuel_cost


class GeoServiceTests(TestCase):
    def test_haversine_known_distance(self):
        """NY to LA should be approximately 2445 miles straight-line."""
        dist = haversine(40.7128, -74.0060, 34.0522, -118.2437)
        self.assertAlmostEqual(dist, 2445, delta=20)

    def test_haversine_zero(self):
        self.assertAlmostEqual(haversine(40.0, -80.0, 40.0, -80.0), 0.0, places=5)

    def test_waypoint_sampling(self):
        coords = [[float(-74 + i * 0.44), float(40.7 - i * 0.067)] for i in range(100)]
        waypoints = sample_waypoints_every_n_miles(coords, 400)
        # Each stop should be ~400 miles apart
        self.assertGreater(len(waypoints), 0)
        for i in range(1, len(waypoints) - 1):
            gap = waypoints[i][2] - waypoints[i - 1][2]
            self.assertAlmostEqual(gap, 400, delta=5)


class FuelServiceTests(TestCase):
    def setUp(self):
        # Create test stations
        FuelStation.objects.create(
            opis_id=1, name="Cheap Station", address="I-80", city="Columbus",
            state="OH", retail_price=2.99, lat=39.9612, lng=-82.9988
        )
        FuelStation.objects.create(
            opis_id=2, name="Expensive Station", address="I-70", city="Columbus",
            state="OH", retail_price=4.50, lat=39.9700, lng=-83.0100
        )

    def test_finds_cheapest_station(self):
        station = find_cheapest_station_near(39.96, -83.00, radius_miles=20)
        self.assertIsNotNone(station)
        self.assertEqual(station.name, "Cheap Station")
        self.assertAlmostEqual(station.retail_price, 2.99)

    def test_no_station_outside_radius(self):
        station = find_cheapest_station_near(35.0, -90.0, radius_miles=10)
        self.assertIsNone(station)

    def test_fuel_cost_calculation(self):
        result = calculate_fuel_cost(distance_miles=400, price_per_gallon=3.00, mpg=10)
        self.assertEqual(result["gallons"], 40.0)
        self.assertEqual(result["cost"], 120.0)


class RouteAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Seed some stations along a mock route
        FuelStation.objects.create(
            opis_id=10, name="Ohio Station", address="I-70", city="Columbus",
            state="OH", retail_price=3.10, lat=39.96, lng=-83.00
        )
        FuelStation.objects.create(
            opis_id=11, name="Kansas Station", address="I-70", city="Salina",
            state="KS", retail_price=2.95, lat=38.84, lng=-97.61
        )

    def test_missing_params(self):
        response = self.client.post("/api/route/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)

    def test_missing_end(self):
        response = self.client.post("/api/route/", {"start": "New York, NY"}, format="json")
        self.assertEqual(response.status_code, 400)

    @patch("api.views.geocode_location")
    @patch("api.views.get_route")
    def test_successful_route(self, mock_get_route, mock_geocode):
        # Mock geocoding
        mock_geocode.side_effect = [(40.71, -74.01), (34.05, -118.24)]

        # Mock route — simulate a 2800 mile route
        coords = [[float(-74 + i * 0.44), float(40.7 - i * 0.067)] for i in range(100)]
        mock_get_route.return_value = {
            "coordinates": coords,
            "distance_miles": 2800,
            "duration_seconds": 144000,
            "geojson": {
                "features": [{
                    "type": "Feature",
                    "geometry": {"type": "LineString", "coordinates": coords},
                    "properties": {"summary": {"distance": 4506000, "duration": 144000}},
                }]
            },
        }

        response = self.client.post(
            "/api/route/",
            {"start": "New York, NY", "end": "Los Angeles, CA"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertIn("summary", data)
        self.assertIn("fuel_stops", data)
        self.assertIn("route", data)
        self.assertEqual(data["summary"]["total_distance_miles"], 2800.0)
        self.assertGreater(data["summary"]["total_fuel_cost_usd"], 0)
        self.assertGreater(len(data["fuel_stops"]), 0)
