
import React, { useEffect, useRef } from 'react';

interface Props {
  onAuthenticated: () => void;
  onAuthFail: (error: string) => void;
}

const BiometricCameraAuth: React.FC<Props> = ({ onAuthenticated, onAuthFail }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('A API da câmera não é suportada neste navegador.');
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Simulate a 2.5 second scan
        const timer = setTimeout(() => {
          onAuthenticated();
        }, 2500);

        return () => clearTimeout(timer);

      } catch (err) {
        console.error("Erro ao acessar a câmera:", err);
        let errorMessage = "Ocorreu um erro ao tentar acessar a câmera.";
        if (err instanceof Error) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = "Permissão para acessar a câmera foi negada. Por favor, habilite a permissão nas configurações do seu navegador.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                 errorMessage = "Nenhuma câmera foi encontrada no seu dispositivo.";
            }
        }
        onAuthFail(errorMessage);
      }
    };

    startCamera();

    return () => {
      // Cleanup: stop the camera stream when the component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onAuthenticated, onAuthFail]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center p-4 text-center bg-slate-800 rounded-2xl shadow-lg border border-slate-700">
      <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-cyan-500 mb-6">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-800"></div>
         <div className="absolute inset-0 border-4 border-cyan-500 rounded-full animate-ping"></div>
      </div>
      <h2 className="text-xl font-bold text-white">Autenticação Facial</h2>
      <p className="text-slate-400 mt-2">Posicione seu rosto no círculo para fazer o login.</p>
    </div>
  );
};

export default BiometricCameraAuth;
