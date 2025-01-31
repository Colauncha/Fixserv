from django.core.management.base import BaseCommand
from artisans.models import Artisan
from users.models import CustomUser, Skill
from random import choice, uniform
from faker import Faker

fake = Faker()

class Command(BaseCommand):
    help = 'Populate the Artisan model with sample data'

    def handle(self, *args, **kwargs):
        # Define sample skills
        skills = list(Skill.objects.all())
        if not skills:
            self.stdout.write(self.style.ERROR("No skills found in the Skill model. Populate it first."))
            return

        # Define sample locations
        locations = [
            "Ikeja, Lagos State", "Victoria Island, Lagos State", "Lekki, Lagos State",
            "Abuja, FCT", "Port Harcourt, Rivers State", "Kano, Kano State"
        ]

        # Define availability options
        availability = [True, False]

        # Check if users exist
        users = CustomUser.objects.filter(user_type="artisan")
        if not users.exists():
            self.stdout.write(self.style.ERROR("No artisan users found. Create users first."))
            return

        # Populate artisans
        for user in users:
            # Skip if the user already has an artisan profile
            if hasattr(user, 'artisan'):
                continue

            artisan = Artisan.objects.create(
                name=fake.name(),
                location=choice(locations),
                rating=round(uniform(3.0, 5.0), 1),  # Random rating between 3.0 and 5.0
                is_available=choice(availability),
                user=user,
            )

            # Assign random skills to the artisan
            random_skills = fake.random_elements(elements=skills, length=3, unique=True)
            artisan.artisan_skills.set(random_skills)

            self.stdout.write(self.style.SUCCESS(f"Created Artisan: {artisan.name}"))

        self.stdout.write(self.style.SUCCESS("Successfully populated Artisan model!"))
