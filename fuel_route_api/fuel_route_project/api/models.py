from django.db import models


class FuelStation(models.Model):
    opis_id = models.IntegerField(db_index=True)
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=10, db_index=True)
    rack_id = models.IntegerField(null=True, blank=True)
    retail_price = models.FloatField(db_index=True)
    lat = models.FloatField(null=True, blank=True, db_index=True)
    lng = models.FloatField(null=True, blank=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["lat", "lng"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.city}, {self.state}) - ${self.retail_price:.3f}"
