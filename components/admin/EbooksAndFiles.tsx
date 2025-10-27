import React, { useState, useEffect, useRef } from 'react';
import { EbookFile } from '../../types';
import { PlusCircle, Pencil, Trash2 } from '../icons/EditorIcons';
import { BookOpen } from '../icons/AdminIcons';
import { X } from '../icons/ChatIcons';

// --- Helper function for resizing images ---
const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error('FileReader did not produce a result.'));
            }
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate the new dimensions to maintain aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                
                // Get the data URL with specified quality
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
            img.src = event.target.result as string;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};

const EbooksAndFiles: React.FC = () => {
    const [files, setFiles] = useState<EbookFile[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFile, setEditingFile] = useState<EbookFile | null>(null);

    useEffect(() => {
        // Simulação de carregamento do Firestore
        try {
            const storedFiles = localStorage.getItem('nutriflow_ebooks');
            if (storedFiles) {
                setFiles(JSON.parse(storedFiles));
            }
        } catch (error) {
            console.error('Failed to load ebooks:', error);
        }
    }, []);

    const handleSaveFile = (file: EbookFile) => {
        setFiles(currentFiles => {
            const isEditing = currentFiles.some(f => f.id === file.id);
            const updatedFiles = isEditing
                ? currentFiles.map(f => (f.id === file.id ? file : f))
                : [...currentFiles, file];
            
            localStorage.setItem('nutriflow_ebooks', JSON.stringify(updatedFiles));
            return updatedFiles;
        });
    };
    
    const handleDeleteFile = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este arquivo? Isso também o removerá para os usuários.")) {
            setFiles(currentFiles => {
                const updatedFiles = currentFiles.filter(f => f.id !== id);
                localStorage.setItem('nutriflow_ebooks', JSON.stringify(updatedFiles));
                return updatedFiles;
            });
        }
    };
    
    const toggleFileStatus = (id: string) => {
        setFiles(currentFiles => {
            const updatedFiles = currentFiles.map(f => {
                if (f.id === id) {
                    // Fix: Explicitly type the new status to prevent TypeScript from widening it to a generic 'string'.
                    const newStatus: 'active' | 'inactive' = f.status === 'active' ? 'inactive' : 'active';
                    return { ...f, status: newStatus };
                }
                return f;
            });
            localStorage.setItem('nutriflow_ebooks', JSON.stringify(updatedFiles));
            return updatedFiles;
        });
    };

    const openModalForNew = () => {
        setEditingFile(null);
        setIsModalOpen(true);
    };

    const openModalForEdit = (file: EbookFile) => {
        setEditingFile(file);
        setIsModalOpen(true);
    };
    
    const getStatusChip = (status: 'active' | 'inactive') => {
        return status === 'active'
            ? <span className="px-2 py-1 text-xs font-semibold text-green-300 bg-green-500/20 rounded-full">Ativo</span>
            : <span className="px-2 py-1 text-xs font-semibold text-red-300 bg-red-500/20 rounded-full">Inativo</span>;
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h1 className="text-3xl font-bold text-cyan-400">E-books & Arquivos</h1>
                <button onClick={openModalForNew} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-semibold">
                    <PlusCircle className="w-5 h-5" />
                    Adicionar Novo Arquivo
                </button>
            </div>
            <p className="text-slate-400 mb-8 -mt-2">
                Gerencie aqui os arquivos e e-books que serão disponibilizados para seus usuários. Use o status "Ativo" para publicá-los ou "Inativo" para ocultá-los temporariamente da visualização do cliente.
            </p>
            
             <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="p-4 font-semibold">Título</th>
                                <th className="p-4 font-semibold">Tipo</th>
                                <th className="p-4 font-semibold">Preço</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                           {files.map(file => (
                                <tr key={file.id} className="hover:bg-slate-700/50">
                                    <td className="p-4 flex items-center gap-3">
                                        <img src={file.coverImage} alt={file.title} className="w-10 h-10 rounded-md object-cover" />
                                        <span>{file.title}</span>
                                    </td>
                                    <td className="p-4 text-slate-400">{file.fileType}</td>
                                    <td className="p-4 font-semibold">{file.isPaid ? `R$ ${file.price?.toFixed(2)}` : 'Gratuito'}</td>
                                    <td className="p-4">
                                        <button onClick={() => toggleFileStatus(file.id)}>
                                            {getStatusChip(file.status)}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openModalForEdit(file)} className="p-2 text-slate-400 hover:text-cyan-400" title="Editar">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteFile(file.id)} className="p-2 text-slate-400 hover:text-red-400" title="Excluir">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
                 {files.length === 0 && (
                    <div className="text-center p-12">
                        <BookOpen className="w-12 h-12 mx-auto text-slate-600" />
                        <h3 className="mt-4 text-lg font-semibold text-white">Nenhum arquivo encontrado</h3>
                        <p className="mt-1 text-sm text-slate-500">Clique em "Adicionar Novo Arquivo" para começar.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <FileModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveFile}
                    file={editingFile}
                />
            )}
        </div>
    );
};

// --- FileModal Component ---

interface FileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (file: EbookFile) => void;
    file: EbookFile | null;
}

const FileModal: React.FC<FileModalProps> = ({ isOpen, onClose, onSave, file }) => {
    const [formData, setFormData] = useState<Omit<EbookFile, 'id' | 'createdAt'>>({
        title: '', description: '', coverImage: '', fileData: '', fileName: '', fileType: '', isPaid: false, price: 0, status: 'active'
    });
    const [isPaid, setIsPaid] = useState(false);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (file) {
            setFormData({ ...file, price: file.price ?? 0 });
            setIsPaid(file.isPaid);
        } else {
            setFormData({ title: '', description: '', coverImage: '', fileData: '', fileName: '', fileType: '', isPaid: false, price: 29.90, status: 'active' });
            setIsPaid(false);
        }
    }, [file, isOpen]);

    const handleFileRead = (file: File, callback: (result: string, name: string, type: string) => void) => {
        const reader = new FileReader();
        reader.onloadend = () => callback(reader.result as string, file.name, file.type);
        reader.readAsDataURL(file);
    };

    const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const imageFile = e.target.files?.[0];
        if (!imageFile) return;

        if (!imageFile.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem (JPG, PNG, etc.).');
            return;
        }

        try {
            // Resize image to a 128x128 thumbnail with 80% JPEG quality
            const resizedImageDataUrl = await resizeImage(imageFile, 128, 128, 0.8);
            setFormData(f => ({ ...f, coverImage: resizedImageDataUrl }));
        } catch (error) {
            console.error("Error resizing image:", error);
            alert("Ocorreu um erro ao processar a imagem. Por favor, tente uma imagem diferente.");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFileRead(e.target.files[0], (result, name, type) => setFormData(f => ({...f, fileData: result, fileName: name, fileType: type})));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData, isPaid, price: isPaid ? formData.price : 0 };
        onSave({
            id: file?.id || new Date().toISOString(),
            createdAt: file?.createdAt || new Date().toISOString(),
            ...finalData
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-cyan-400">{file ? 'Editar' : 'Adicionar'} Arquivo</h2>
                    <button onClick={onClose}><X className="w-6 h-6" /></button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
                    <input type="file" ref={coverInputRef} onChange={handleCoverChange} className="hidden" accept="image/jpeg,image/png,image/gif,image/webp" />
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.xlsx,.jpg,.png" />

                    <div className="flex items-start gap-4">
                        <button type="button" onClick={() => coverInputRef.current?.click()} className="w-24 h-24 flex-shrink-0 bg-slate-700 rounded-md flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-600 hover:border-cyan-500">
                            {formData.coverImage ? <img src={formData.coverImage} alt="Capa" className="w-full h-full object-cover rounded-md" /> : 'Capa'}
                        </button>
                        <div className="flex-1 space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm mb-1">Título</label>
                                <input type="text" id="title" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} className="w-full bg-slate-700 p-2 rounded-md" required />
                            </div>
                             <div>
                                <label htmlFor="description" className="block text-sm mb-1">Descrição Curta</label>
                                <textarea id="description" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full bg-slate-700 p-2 rounded-md" required></textarea>
                            </div>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm mb-1">Arquivo</label>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-3 bg-slate-700 rounded-md border-2 border-dashed border-slate-600 hover:border-cyan-500 text-sm">
                            {formData.fileName || 'Clique para selecionar (PDF, DOCX, XLSX, JPG, PNG)'}
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm mb-2 font-medium text-slate-300">Tipo de Monetização</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div 
                                onClick={() => setIsPaid(false)}
                                className={`p-4 rounded-lg border-2 cursor-pointer text-center transition-all ${!isPaid ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-600 bg-slate-700/50 hover:border-cyan-600'}`}
                            >
                                <h4 className="font-semibold text-white">Arquivo Gratuito</h4>
                                <p className="text-xs text-slate-400">Acessível para todos os usuários.</p>
                            </div>
                             <div 
                                onClick={() => setIsPaid(true)}
                                className={`p-4 rounded-lg border-2 cursor-pointer text-center transition-all ${isPaid ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-600 bg-slate-700/50 hover:border-cyan-600'}`}
                            >
                                <h4 className="font-semibold text-white">Arquivo Pago</h4>
                                <p className="text-xs text-slate-400">Requer compra para acesso.</p>
                            </div>
                        </div>
                    </div>
                    {isPaid && (
                        <div className="animate-fade-in">
                           <label htmlFor="price" className="block text-sm mb-1">Preço (R$)</label>
                           <input type="number" id="price" value={formData.price} onChange={e => setFormData(f => ({...f, price: Number(e.target.value)}))} step="0.01" className="w-full bg-slate-700 p-2 rounded-md" required />
                       </div>
                    )}
                </form>
                <footer className="p-4 border-t border-slate-700">
                    <button type="submit" onClick={handleSubmit} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-lg">Salvar Arquivo</button>
                </footer>
            </div>
        </div>
    );
};

export default EbooksAndFiles;