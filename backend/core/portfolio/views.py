from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import SenderSerializer
from .models import Sender
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class SendMessage(APIView):
    def post(self, request):
        serializer = SenderSerializer(data=request.data)

        if serializer.is_valid():
            # Save to database
            serializer.save()
            
            # Try to send email (but don't fail if email isn't configured)
            try:
                message = f"Sender's Name: {serializer.validated_data['name']}\nSender's Email: {serializer.validated_data['email']}\nMessage: {serializer.validated_data['message']}"
                
                send_mail(
                    subject='Portfolio Contact Message',
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.EMAIL_HOST_USER],
                    fail_silently=False,
                )
                logger.info("Email sent successfully")
            except Exception as e:
                logger.warning(f"Email failed to send: {str(e)}")
                # Don't fail the request if email fails
            
            # Always return success if data was saved
            return Response({
                'success': True,
                'message': 'Message sent successfully!'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'message': 'Invalid data',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
            

