

'use client';

import * as React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { nanoid } from 'nanoid';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/crop-image';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, Camera } from 'lucide-react';
import { addCroppedGalleryImage } from './actions';
import { Textarea } from '@/components/ui/textarea';

export const ImageCropModal = ({
  open,
  onOpenChange,
  confrariaId,
  onUploadSuccess,
  imageType,
  aspect,
  cropShape,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confrariaId: number;
  onUploadSuccess: () => void;
  imageType: 'seal_url' | 'cover_url';
  aspect: number;
  cropShape: 'round' | 'rect';
  title: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

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
      const imageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!imageBlob) {
        throw new Error('Não foi possível cortar a imagem.');
      }

      const pathPrefix = imageType === 'seal_url' ? 'selo' : 'capa';
      const fileName = `confrarias/${confrariaId}/${pathPrefix}/${pathPrefix}-${nanoid()}.webp`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public-images')
        .upload(fileName, imageBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/webp',
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('public-images').getPublicUrl(uploadData.path);

      const { error: dbError } = await supabase
        .from('confrarias')
        .update({ [imageType]: publicUrl })
        .eq('id', confrariaId);

      if (dbError) {
        await supabase.storage.from('public-images').remove([fileName]);
        throw dbError;
      }

      toast({ title: 'Sucesso!', description: 'Imagem atualizada com sucesso!' });
      onUploadSuccess();
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Erro no Upload',
        description: e.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal is closed
  useEffect(() => {
    if (!open) {
      setImageSrc(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={imageSrc ? (aspect === 1 ? 'sm:max-w-[450px]' : 'sm:max-w-2xl' ) : 'sm:max-w-[425px]'}>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{title}</DialogTitle>
          <DialogDescription>
            {imageSrc
              ? 'Ajuste a imagem para o tamanho desejado.'
              : 'Selecione uma nova imagem.'}
          </DialogDescription>
        </DialogHeader>
        {imageSrc ? (
          <div className="space-y-4">
            <div className="relative h-64 w-full bg-muted rounded-md">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape={cropShape}
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
              <Button
                variant="ghost"
                onClick={() => setImageSrc(null)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveCrop} disabled={loading}>
                {loading && <Loader2 className="animate-spin mr-2" />}
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <Button onClick={() => inputRef.current?.click()} className="w-full">
              <Camera className="mr-2" /> Selecionar Imagem
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
};


export const GalleryImageCropModal = ({
  open,
  onOpenChange,
  confrariaId,
  onUploadSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confrariaId: number;
  onUploadSuccess: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [description, setDescription] = useState("");
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
      const imageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!imageBlob) {
        throw new Error('Não foi possível cortar a imagem.');
      }

      const result = await addCroppedGalleryImage({
          confrariaId,
          image: imageBlob,
          description,
      });

      if (result.error) {
          throw new Error(result.error);
      }
      
      toast({ title: 'Sucesso!', description: result.message });
      onUploadSuccess();
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Erro no Upload',
        description: e.message || 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal is closed
  useEffect(() => {
    if (!open) {
      setImageSrc(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setDescription('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={imageSrc ? 'sm:max-w-2xl' : 'sm:max-w-[425px]'}>
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Adicionar Imagem à Galeria</DialogTitle>
          <DialogDescription>
            {imageSrc
              ? 'Ajuste a imagem e adicione uma descrição opcional.'
              : 'Selecione uma imagem para a sua galeria.'}
          </DialogDescription>
        </DialogHeader>
        {imageSrc ? (
          <div className="space-y-4">
            <div className="relative h-64 w-full bg-muted rounded-md">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={4/3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
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
            <div className="space-y-2">
                <label htmlFor="description">Descrição (Opcional)</label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o momento ou a imagem..."/>
            </div>
            <DialogFooter>
                 <Button
                    variant="ghost"
                    onClick={() => setImageSrc(null)}
                    disabled={loading}
                >
                    Escolher Outra
                </Button>
                <Button onClick={handleSaveCrop} disabled={loading}>
                    {loading && <Loader2 className="animate-spin mr-2" />}
                    Adicionar à Galeria
                </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="py-4">
            <Button onClick={() => inputRef.current?.click()} className="w-full">
              <Camera className="mr-2" /> Selecionar Imagem
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
};
