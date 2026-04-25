#!/bin/bash
set -e

echo "=== Fuel Route API Setup ==="

echo "1. Creating virtual environment..."
python -m venv venv
source venv/bin/activate

echo "2. Installing dependencies..."
pip install -r requirements.txt

echo "3. Running migrations..."
python manage.py migrate

echo "4. Loading fuel data..."
python manage.py load_fuel_data --csv fuel-prices-for-be-assessment.csv

echo ""
echo "=== Setup complete! ==="
echo ""
echo "IMPORTANT: Add your ORS API key to .env before running:"
echo "  ORS_API_KEY=your_key_here"
echo ""
echo "Get a free key at: https://openrouteservice.org/dev/#/signup"
echo ""
echo "Start the server with:"
echo "  python manage.py runserver"
