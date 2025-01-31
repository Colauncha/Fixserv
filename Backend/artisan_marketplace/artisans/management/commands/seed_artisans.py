# artisan/management/commands/seed_artisans.py

from django.core.management.base import BaseCommand
from artisans.models import Artisan

class Command(BaseCommand):
    help = 'Seed the database with artisan data'

    def handle(self, *args, **kwargs):
        Artisan.objects.all().delete()  # Clear existing data
        
        data = [
            {"name": "Abbas Akande", "category": "Television", "location": "Ikeja, Lagos State", "rating": 5.0, "is_available": True},
            {"name": "John Doe", "category": "Refrigerator", "location": "Victoria Island, Lagos State", "rating": 4.5, "is_available": True},
            {"name": "Jane Smith", "category": "Gadgets", "location": "Lekki, Lagos State", "rating": 4.0, "is_available": False},
            {"name": "Grace Oladipo", "category": "Air Conditioner", "location": "Surulere, Lagos State", "rating": 4.8, "is_available": True},
            {"name": "Emeka Nwachukwu", "category": "Washing Machine", "location": "Ajah, Lagos State", "rating": 4.6, "is_available": False},
            {"name": "Samuel Adeoye", "category": "Refrigerator", "location": "Yaba, Lagos State", "rating": 4.7, "is_available": True},
            {"name": "Aisha Bello", "category": "Microwave", "location": "Ikoyi, Lagos State", "rating": 5.0, "is_available": True},
            {"name": "Chidi Okafor", "category": "Laptop", "location": "Ogba, Lagos State", "rating": 4.2, "is_available": False},
            {"name": "Micheal Ajayi", "category": "Television", "location": "Festac, Lagos State", "rating": 4.9, "is_available": True},
            {"name": "Tolu Adebayo", "category": "Refrigerator", "location": "Apapa, Lagos State", "rating": 4.4, "is_available": True},
            {"name": "Fola Alabi", "category": "Gadgets", "location": "Magodo, Lagos State", "rating": 4.5, "is_available": False},
            {"name": "Seyi Akinyemi", "category": "Washing Machine", "location": "Ikeja, Lagos State", "rating": 4.3, "is_available": True},
            {"name": "Durojaiye Ogunleye", "category": "Air Conditioner", "location": "Lekki, Lagos State", "rating": 4.6, "is_available": False}
        ]
        
        for artisan in data:
            Artisan.objects.create(**artisan)
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded artisan data'))
