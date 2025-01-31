from django.core.management.base import BaseCommand
from artisans.models import Artisan, Booking
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed the database with artisan bookings'

    def handle(self, *args, **kwargs):
        # Clear existing bookings
        Booking.objects.all().delete()

        # Example seed data
        client = User.objects.first()  # Assume a client exists
        artisan = Artisan.objects.first()  # Assume an artisan exists

        if client and artisan:
            Booking.objects.create(
                client=client,
                artisan=artisan,
                status='confirmed',
                service_date=datetime.now().date() + timedelta(days=3),
                service_time='10:00:00',
            )
            self.stdout.write(self.style.SUCCESS('Successfully seeded booking data'))
        else:
            self.stdout.write(self.style.WARNING('No client or artisan available to seed'))
