"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStream(stream);
      } catch (err) {
        console.error("Error accessing camera: ", err);
        const errorMessage = "Could not access camera. Please check permissions and try again.";
        setError(errorMessage);
        toast({
            variant: 'destructive',
            title: 'Camera Error',
            description: errorMessage
        });
        onCancel();
      }
    };

    getCameraStream();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [toast, onCancel]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const dataUri = canvas.toDataURL('image/jpeg');
        onCapture(dataUri);
        
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  }, [onCapture, stream]);

  if (error) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-500">
      <CardContent className="p-0 relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-auto object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
      <CardFooter className="bg-background/80 backdrop-blur-sm p-4 flex justify-center gap-4">
        <Button size="lg" onClick={onCancel} variant="secondary">
          <X className="mr-2 h-5 w-5" />
          Cancel
        </Button>
        <Button size="lg" onClick={handleCapture} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Camera className="mr-2 h-5 w-5" />
          Capture
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CameraCapture;
