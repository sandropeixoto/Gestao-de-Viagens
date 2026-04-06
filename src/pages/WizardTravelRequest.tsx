import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, ChevronLeft, UploadCloud } from 'lucide-react';
import { uploadTravelDocument } from '../lib/storage';

const travelSchema = z.object({
    origem: z.string().min(2, 'A origem é obrigatória'),
    destino: z.string().min(2, 'O destino é obrigatório'),
    dataIda: z.string().min(1, 'Data de ida é obrigatória'),
    dataRetorno: z.string().min(1, 'Data de retorno é obrigatória'),
    justificativa: z.string().min(5, 'A justificativa é obrigatória'),
    fonteRecurso: z.enum(['Tesouro', 'FIPAT', 'BID']),
    tipoTransporte: z.string().min(2, 'O transporte é obrigatório'),
    roteiro: z.string().min(5, 'Descreva o roteiro.'),
}).refine((data) => new Date(data.dataRetorno) >= new Date(data.dataIda), {
    message: "A data de retorno não pode ser anterior à ida",
    path: ["dataRetorno"],
});

type TravelFormData = z.infer<typeof travelSchema>;

const STEPS = [
    { id: 1, name: 'Dados Básicos' },
    { id: 2, name: 'Detalhes' },
    { id: 3, name: 'Roteiro' },
    { id: 4, name: 'Anexos' },
];

export default function WizardTravelRequest() {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    const { register, handleSubmit, trigger, formState: { errors } } = useForm<TravelFormData>({
        resolver: zodResolver(travelSchema),
        defaultValues: {
            fonteRecurso: 'Tesouro',
        }
    });

    const nextStep = async () => {
        let fieldsToValidate: (keyof TravelFormData)[] = [];
        if (currentStep === 1) fieldsToValidate = ['origem', 'destino', 'dataIda', 'dataRetorno'];
        if (currentStep === 2) fieldsToValidate = ['justificativa', 'fonteRecurso', 'tipoTransporte'];
        if (currentStep === 3) fieldsToValidate = ['roteiro'];

        const isStepValid = await trigger(fieldsToValidate);
        if (isStepValid) {
            setCurrentStep((prev) => Math.min(prev + 1, 4));
        }
    };

    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    // Hook simulado de upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const onSubmit = async (data: TravelFormData) => {
        setIsSubmitting(true);
        try {
            // 1. Insert Request
            // Calcular valor previsto (exemplo: 250 por dia)
            const dateIda = new Date(data.dataIda);
            const dateRetorno = new Date(data.dataRetorno);
            const diffDays = Math.ceil(Math.abs(dateRetorno.getTime() - dateIda.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const valorPrevisto = diffDays * 250;

            const { data: request, error: insertError } = await supabase.from('travel_requests').insert({
                user_id: user?.id,
                destino: data.destino,
                data_ida: data.dataIda,
                data_retorno: data.dataRetorno,
                justificativa: `${data.justificativa} | Transporte: ${data.tipoTransporte} | Origem: ${data.origem} | Roteiro: ${data.roteiro}`,
                fonte_recurso: data.fonteRecurso,
                valor_previsto: valorPrevisto,
                status: 'Aguardando Chefia'
            }).select().single();

            if (insertError) {
                if (insertError.message.includes('servidor já possui uma viagem agendada')) {
                    showNotification('Conflito de Datas: Você já possui uma viagem aprovada ou pendente para este período.', 'error');
                    return;
                }
                throw insertError;
            }

            // 2. Real Upload to Storage
            if (files.length > 0 && request) {
                const uploadPromises = files.map(file => 
                    uploadTravelDocument(user!.id, request.id, file, 'comprovante')
                );
                await Promise.all(uploadPromises);
            }

            navigate('/dashboard');
            showNotification('Solicitação enviada com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            showNotification('Erro ao criar solicitação.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Solicitação de Viagem</h1>
                    <p className="text-gray-600 mt-1">Preencha o formulário passo a passo.</p>
                </div>
            </div>

            {/* Stepper Progress */}
            <nav aria-label="Progress" className="relative z-0">
                <ol className="flex items-center justify-between w-full">
                    {STEPS.map((step, stepIdx) => (
                        <li key={step.name} className="relative flex flex-col items-center flex-1">
                            {stepIdx !== STEPS.length - 1 && (
                                <div className="absolute top-4 left-[50%] w-full h-0.5" aria-hidden="true">
                                    <div className={`h-full transition-all duration-500 ${currentStep > step.id ? 'bg-accent-500' : 'bg-slate-200'}`} />
                                </div>
                            )}
                            <div
                                className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${currentStep > step.id ? 'bg-accent-600 shadow-lg shadow-accent-200' :
                                        currentStep === step.id ? 'border-2 border-accent-600 bg-white ring-4 ring-accent-50' : 'border-2 border-slate-300 bg-white'
                                    }`}
                            >
                                {currentStep > step.id ? (
                                    <Check className="h-4 w-4 text-white" aria-hidden="true" />
                                ) : (
                                    <span className={`text-xs font-bold ${currentStep === step.id ? 'text-accent-600' : 'text-slate-500'}`}>
                                        {step.id}
                                    </span>
                                )}
                            </div>
                            <span className={`mt-3 text-[10px] uppercase tracking-wider font-bold transition-colors ${currentStep === step.id ? 'text-accent-700' : 'text-slate-400'}`}>
                                {step.name}
                            </span>
                        </li>
                    ))}
                </ol>
            </nav>

            <form onSubmit={handleSubmit(onSubmit)} className="glass-card rounded-3xl p-8 mt-12 border border-white/20 shadow-2xl">
                {/* Step 1: Dados Básicos */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-medium text-gray-900 border-b pb-2">Dados Básicos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                                <input {...register('origem')} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Cidade Origem" />
                                {errors.origem && <p className="mt-1 text-sm text-red-600">{errors.origem.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                                <input {...register('destino')} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Cidade Destino" />
                                {errors.destino && <p className="mt-1 text-sm text-red-600">{errors.destino.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Ida</label>
                                <input type="date" {...register('dataIda')} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                                {errors.dataIda && <p className="mt-1 text-sm text-red-600">{errors.dataIda.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Retorno</label>
                                <input type="date" {...register('dataRetorno')} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                                {errors.dataRetorno && <p className="mt-1 text-sm text-red-600">{errors.dataRetorno.message}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Detalhes */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-medium text-gray-900 border-b pb-2">Detalhes Institucionais</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Justificativa Institucional</label>
                            <textarea {...register('justificativa')} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Motivo da viagem e relevância institucional" />
                            {errors.justificativa && <p className="mt-1 text-sm text-red-600">{errors.justificativa.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fonte de Recurso</label>
                                <select {...register('fonteRecurso')} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white">
                                    <option value="Tesouro">Tesouro</option>
                                    <option value="FIPAT">FIPAT</option>
                                    <option value="BID">BID</option>
                                </select>
                                {errors.fonteRecurso && <p className="mt-1 text-sm text-red-600">{errors.fonteRecurso.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Transporte</label>
                                <input {...register('tipoTransporte')} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Aéreo, Terrestre, Veículo Oficial..." />
                                {errors.tipoTransporte && <p className="mt-1 text-sm text-red-600">{errors.tipoTransporte.message}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Roteiro */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-medium text-gray-900 border-b pb-2">Roteiro Detalhado</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plano dia a dia</label>
                            <textarea {...register('roteiro')} rows={6} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Descreva as atividades previstas para cada dia de viagem..." />
                            {errors.roteiro && <p className="mt-1 text-sm text-red-600">{errors.roteiro.message}</p>}
                        </div>
                    </div>
                )}

                {/* Step 4: Anexos */}
                {currentStep === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-medium text-gray-900 border-b pb-2">Anexos e Documentos</h2>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors">
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4 flex text-sm text-gray-600 justify-center">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                    <span>Upload de arquivos</span>
                                    <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileUpload} />
                                </label>
                                <p className="pl-1">ou arraste e solte</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">PDF, PNG, JPG até 10MB</p>
                        </div>
                        {files.length > 0 && (
                            <ul className="mt-4 space-y-2">
                                {files.map((file, i) => (
                                    <li key={i} className="text-sm text-gray-700 bg-gray-50 px-4 py-2 rounded border flex justify-between">
                                        <span>{file.name}</span>
                                        <span className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                        <ChevronLeft size={16} /> Anterior
                    </button>

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                        >
                            Próximo <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Enviando...' : 'Finalizar Solicitação'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
