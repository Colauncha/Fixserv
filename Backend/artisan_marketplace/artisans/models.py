from django.db import models
from django.conf import settings  # To link the client (user)

# Create your models here.


class Artisan(models.Model):
    CATEGORIES = [
        ('Television', 'Television'),
        ('Refrigerator', 'Refrigerator'),
        ('Gadgets', 'Gadgets'),
        ('Game Gadgets', 'Game Gadgets'),
    ]

    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, choices=CATEGORIES)
    location = models.CharField(max_length=100)
    rating = models.DecimalField(max_digits=3, decimal_places=1)  # e.g., 4.5
    profile_picture = models.ImageField(upload_to='artisans/', blank=True, null=True)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name
    
    
    


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('canceled', 'Canceled'),
    ]

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings'
    )  # The client who booked the artisan
    artisan = models.ForeignKey(
        'artisans.Artisan', on_delete=models.CASCADE, related_name='bookings'
    )  # The artisan who was booked
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='pending'
    )  # Booking status
    booked_date = models.DateTimeField(auto_now_add=True)  # When the booking was made
    service_date = models.DateField()  # Date of the service
    service_time = models.TimeField()  # Time of the service

    def __str__(self):
        return f"Booking by {self.client.email} for {self.artisan.name} on {self.service_date}"
