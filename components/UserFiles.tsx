import React, { useState, useEffect } from 'react';
import { User, EbookFile } from '../types';
import { ArrowLeft } from './icons/ArrowLeft';
import { Lock, Unlock, Download, Mail, MessageSquare } from 'lucide-react';
import PurchaseModal from './PurchaseModal';

interface Props {
  user: User;
  onPurchaseFile: (fileId: string) => void;
  onBack: () => void;
}

const UserFiles: React.FC<Props> = ({ user, onPurchaseFile, onBack }) => {
  const [files, setFiles] = useState<EbookFile[]>([]);
  const [purchasingFile, setPurchasingFile] = useState<EbookFile | null>(null);

  useEffect(() => {
    // Simulação de carregamento do Firestore, buscando apenas arquivos ativos
    try {
      const allFiles: EbookFile[] = JSON.parse(localStorage.getItem('nutriflow_ebooks') || '[]');
      setFiles(allFiles.filter(f => f.status === 'active'));
    } catch (error) {
      console.error('Failed to load user files:', error);
    }
  }, []);

  const handlePurchaseConfirm = (file: EbookFile) => {
    onPurchaseFile(file.id);
    setPurchasingFile(null);
     // Adicionar um pequeno atraso para o usuário ver a mudança de estado
    setTimeout(() => {
        alert(`Compra de "${file.title}" confirmada! O arquivo está desbloqueado.`);
    }, 100);
  };
  
  const handleDownload = (file: EbookFile) => {
    // Simulação de download
    const link = document.createElement('a');
    link.href = file.fileData;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleShareEmail = (file: EbookFile) => {
     const subject = encodeURIComponent(`Confira este arquivo: ${file.title}`);
     const body = encodeURIComponent(`Eu acho que você vai gostar deste arquivo da NutriFlow AI: ${file.title}.\n\n${file.description}`);
     window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleShareWhatsApp = (file: EbookFile) => {
      const text = encodeURIComponent(`Confira este arquivo da NutriFlow AI: *${file.title}*`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const FileCard: React.FC<{ file: EbookFile }> = ({ file }) => {
    const isPurchased = user.purchasedFileIds?.includes(file.id) ?? false;
    const isFree = !file.isPaid;
    const isUnlocked = isFree || isPurchased;

    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col group">
        <div className="relative">
          <img src={file.coverImage} alt={file.title} className="w-full h-48 object-cover" />
          <div className="absolute top-2 right-2 p-2 bg-black/50 rounded-full">
            {isUnlocked ? (
              <Unlock className="w-5 h-5 text-green-400" />
            ) : (
              <Lock className="w-5 h-5 text-red-400" />
            )}
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-lg text-white">{file.title}</h3>
          <p className="text-sm text-slate-400 mt-1 flex-1">{file.description}</p>
          <div className="mt-4">
            {isUnlocked ? (
               <div className="flex items-center justify-around gap-2">
                    <button onClick={() => handleDownload(file)} className="p-2 flex-1 flex justify-center bg-slate-700 hover:bg-cyan-500 rounded-md transition-colors" title="Baixar"><Download className="w-5 h-5" /></button>
                    <button onClick={() => handleShareEmail(file)} className="p-2 flex-1 flex justify-center bg-slate-700 hover:bg-cyan-500 rounded-md transition-colors" title="Enviar por E-mail"><Mail className="w-5 h-5" /></button>
                    <button onClick={() => handleShareWhatsApp(file)} className="p-2 flex-1 flex justify-center bg-slate-700 hover:bg-cyan-500 rounded-md transition-colors" title="Compartilhar no WhatsApp"><MessageSquare className="w-5 h-5" /></button>
                </div>
            ) : (
              <button onClick={() => setPurchasingFile(file)} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-transform hover:scale-105">
                {`Comprar por R$ ${file.price?.toFixed(2)}`}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="animate-fade-in w-full">
      <div className="relative mb-8 text-center">
        <button onClick={onBack} className="absolute top-1/2 -translate-y-1/2 left-0 text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <h1 className="text-3xl font-bold text-cyan-400">E-books e Arquivos</h1>
      </div>

      {files.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {files.map(file => <FileCard key={file.id} file={file} />)}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400">Nenhum e-book disponível no momento. Aguarde novas atualizações do administrador.</p>
        </div>
      )}

      {purchasingFile && (
        <PurchaseModal
            isOpen={!!purchasingFile}
            onClose={() => setPurchasingFile(null)}
            file={purchasingFile}
            onConfirm={handlePurchaseConfirm}
        />
      )}
    </div>
  );
};

export default UserFiles;