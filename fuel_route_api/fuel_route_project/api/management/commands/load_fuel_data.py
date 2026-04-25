"""
Management command: load_fuel_data
Reads the OPIS CSV, geocodes each station using the offline 'zipcodes'
library (City + State → lat/lng), and bulk-inserts into FuelStation table.

Usage:
    python manage.py load_fuel_data --csv /path/to/fuel-prices.csv [--clear]
"""
import csv
from django.core.management.base import BaseCommand
from api.models import FuelStation
import zipcodes as zc

US_STATES = {
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
    "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
    "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
    "TX","UT","VT","VA","WA","WV","WI","WY","DC",
}

STATE_CENTERS = {
    "AL":(32.806671,-86.791130),"AK":(61.370716,-152.404419),
    "AZ":(33.729759,-111.431221),"AR":(34.969704,-92.373123),
    "CA":(36.116203,-119.681564),"CO":(39.059811,-105.311104),
    "CT":(41.597782,-72.755371),"DE":(39.318523,-75.507141),
    "FL":(27.766279,-81.686783),"GA":(33.040619,-83.643074),
    "HI":(21.094318,-157.498337),"ID":(44.240459,-114.478828),
    "IL":(40.349457,-88.986137),"IN":(39.849426,-86.258278),
    "IA":(42.011539,-93.210526),"KS":(38.526600,-96.726486),
    "KY":(37.668140,-84.670067),"LA":(31.169960,-91.867805),
    "ME":(44.693947,-69.381927),"MD":(39.063946,-76.802101),
    "MA":(42.230171,-71.530106),"MI":(43.326618,-84.536095),
    "MN":(45.694454,-93.900192),"MS":(32.741646,-89.678696),
    "MO":(38.456085,-92.288368),"MT":(46.921925,-110.454353),
    "NE":(41.125370,-98.268082),"NV":(38.313515,-117.055374),
    "NH":(43.452492,-71.563896),"NJ":(40.298904,-74.521011),
    "NM":(34.840515,-106.248482),"NY":(42.165726,-74.948051),
    "NC":(35.630066,-79.806419),"ND":(47.528912,-99.784012),
    "OH":(40.388783,-82.764915),"OK":(35.565342,-96.928917),
    "OR":(44.572021,-122.070938),"PA":(40.590752,-77.209755),
    "RI":(41.680893,-71.511780),"SC":(33.856892,-80.945007),
    "SD":(44.299782,-99.438828),"TN":(35.747845,-86.692345),
    "TX":(31.054487,-97.563461),"UT":(40.150032,-111.862434),
    "VT":(44.045876,-72.710686),"VA":(37.769337,-78.169968),
    "WA":(47.400902,-121.490494),"WV":(38.491226,-80.954453),
    "WI":(44.268543,-89.616508),"WY":(42.755966,-107.302490),
    "DC":(38.897438,-77.026817),
}


class Command(BaseCommand):
    help = "Load fuel station data from OPIS CSV into the database"

    def add_arguments(self, parser):
        parser.add_argument("--csv", required=True, help="Path to the fuel prices CSV file")
        parser.add_argument("--clear", action="store_true", help="Clear existing data first")

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing fuel stations...")
            FuelStation.objects.all().delete()

        # Build city→lat/lng cache to avoid repeated lookups
        self.stdout.write("Building city geocoding cache...")
        city_cache = {}  # (city_upper, state) → (lat, lng)

        with open(options["csv"], newline="", encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))

        # Pre-cache all unique city+state combos
        unique_cities = set()
        for row in rows:
            state = row["State"].strip().upper()
            if state in US_STATES:
                unique_cities.add((row["City"].strip(), state))

        for city, state in unique_cities:
            results = zc.filter_by(city=city, state=state)
            if results:
                r = results[0]
                try:
                    city_cache[(city.upper(), state)] = (float(r["lat"]), float(r["long"]))
                except (ValueError, KeyError):
                    pass

        self.stdout.write(f"  Geocoded {len(city_cache)} / {len(unique_cities)} unique cities")

        stations = []
        skipped = 0
        geo_city = 0
        geo_state = 0

        for row in rows:
            state = row["State"].strip().upper()
            if state not in US_STATES:
                skipped += 1
                continue

            try:
                price = float(row["Retail Price"])
            except (ValueError, KeyError):
                skipped += 1
                continue

            city_raw = row["City"].strip()
            key = (city_raw.upper(), state)

            if key in city_cache:
                lat, lng = city_cache[key]
                geo_city += 1
            elif state in STATE_CENTERS:
                lat, lng = STATE_CENTERS[state]
                geo_state += 1
            else:
                skipped += 1
                continue

            try:
                rack_id = int(row.get("Rack ID", 0) or 0)
            except ValueError:
                rack_id = None

            stations.append(FuelStation(
                opis_id=int(row["OPIS Truckstop ID"]),
                name=row["Truckstop Name"].strip(),
                address=row["Address"].strip(),
                city=city_raw,
                state=state,
                rack_id=rack_id,
                retail_price=price,
                lat=lat,
                lng=lng,
            ))

        self.stdout.write(f"  City-geocoded: {geo_city} | State-fallback: {geo_state} | Skipped: {skipped}")
        self.stdout.write(f"Inserting {len(stations)} stations...")

        batch_size = 500
        for i in range(0, len(stations), batch_size):
            FuelStation.objects.bulk_create(stations[i:i + batch_size], ignore_conflicts=False)

        self.stdout.write(self.style.SUCCESS(f"✓ Done! {len(stations)} fuel stations loaded."))
