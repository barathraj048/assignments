import math
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from api.services.routing import geocode_location, get_route
from api.services.fuel import plan_fuel_stops


class RouteView(APIView):
    """
    POST /api/route/

    Request body:
        {
            "start": "New York, NY",
            "end": "Los Angeles, CA"
        }

    Returns the optimal route with fuel stops and total cost.
    """

    def post(self, request):
        start = request.data.get("start", "").strip()
        end = request.data.get("end", "").strip()

        if not start or not end:
            return Response(
                {"error": "Both 'start' and 'end' fields are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Step 1: Geocode start and end (2 ORS geocoding calls) ---
        try:
            start_lat, start_lng = geocode_location(start)
            end_lat, end_lng = geocode_location(end)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"Geocoding failed: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # --- Step 2: Get route (1 ORS routing call) ---
        try:
            route = get_route(start_lat, start_lng, end_lat, end_lng)
        except Exception as e:
            return Response(
                {"error": f"Routing failed: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        total_miles = route["distance_miles"]

        # --- Step 3: Plan fuel stops (pure DB + in-memory computation) ---
        fuel_plan = plan_fuel_stops(route["coordinates"], total_miles)

        # --- Step 4: Format duration ---
        duration_hrs = int(route["duration_seconds"] // 3600)
        duration_min = int((route["duration_seconds"] % 3600) // 60)

        return Response({
            "summary": {
                "start": start,
                "end": end,
                "total_distance_miles": round(total_miles, 1),
                "estimated_drive_time": f"{duration_hrs}h {duration_min}m",
                "vehicle_range_miles": settings.VEHICLE_RANGE_MILES,
                "vehicle_mpg": settings.VEHICLE_MPG,
                "total_fuel_stops": len(fuel_plan["fuel_stops"]),
                "total_gallons": fuel_plan["total_gallons"],
                "total_fuel_cost_usd": fuel_plan["total_fuel_cost_usd"],
            },
            "fuel_stops": fuel_plan["fuel_stops"],
            "route": {
                "type": "FeatureCollection",
                "features": route["geojson"]["features"],
            },
        })


class HealthView(APIView):
    def get(self, request):
        from api.models import FuelStation
        return Response({
            "status": "ok",
            "fuel_stations_loaded": FuelStation.objects.count(),
        })
