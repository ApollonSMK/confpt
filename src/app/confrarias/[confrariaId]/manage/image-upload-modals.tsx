

'use client';

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Camera, Loader2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/crop-image';
import { updateConfrariaImageUrl } from './actions';
import { createClient } from '@/lib/supabase/client';
import { nanoid } from 'nanoid';

export function SealUploadModal({ confrariaId, onUploadSuccess, children }: { confrariaId: number, onUploadSuccess: () => void, children: React.ReactNode }) {
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCrop = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setLoading(true);
        try {
            const supabase = createClient();
            const imageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!imageBlob) {
                throw new Error("Não foi possível cortar a imagem.");
            }

            const fileName = `confrarias/${confrariaId}/selo/selo-${nanoid()}.webp`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('public-images')
                .upload(fileName, imageBlob, { upsert: true, contentType: 'image/webp' });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('public-images').getPublicUrl(uploadData.path);
            
            const result = await updateConfrariaImageUrl(confrariaId, 'seal_url', publicUrl);

            if (result.error) {
                toast({ title: 'Erro', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Sucesso!', description: result.message });
                onUploadSuccess();
                closeModal();
            }
        } catch (e: any) {
            console.error(e);
            toast({ title: 'Erro no Upload', description: e.message || 'Ocorreu um erro inesperado.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setIsOpen(false);
        setImageSrc(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeModal(); else setIsOpen(true); }}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className={imageSrc ? 'sm:max-w-[450px]' : 'sm:max-w-[425px]'}>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Atualizar Selo</DialogTitle>
                    <DialogDescription>{imageSrc ? 'Ajuste a imagem para caber no círculo.' : 'Selecione uma nova imagem para o selo da confraria.'}</DialogDescription>
                </DialogHeader>
                {imageSrc ? (
                    <div className="space-y-4">
                        <div className="relative h-64 w-full bg-muted rounded-md">
                             <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                                cropShape="round"
                                showGrid={false}
                            />
                        </div>
                        <div className="space-y-2">
                             <label htmlFor="zoom-slider">Zoom</label>
                             <Slider
                                id="zoom-slider"
                                min={1}
                                max={3}
                                step={0.1}
                                value={[zoom]}
                                onValueChange={(val) => setZoom(val[0])}
                             />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setImageSrc(null)} disabled={loading}>Cancelar</Button>
                            <Button onClick={handleSaveCrop} disabled={loading}>
                                {loading && <Loader2 className="animate-spin mr-2"/>}
                                Guardar Selo
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        <Button onClick={() => inputRef.current?.click()} className="w-full">
                           <Camera className="mr-2"/> Selecionar Imagem
                        </Button>
                        <input
                            type="file"
                            ref={inputRef}
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
