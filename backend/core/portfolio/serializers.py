from rest_framework import serializers
from .models import Sender

class SenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sender
        fields = '__all__'