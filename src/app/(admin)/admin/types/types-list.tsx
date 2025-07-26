
'use client';

import { useState } from 'react';
import { type DiscoveryType } from '@/lib/data';
import { deleteType } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Trash2 } from 'lucide-react';

interface TypesListProps {
  types: DiscoveryType[];
}

export function TypesList({ types: initialTypes }: TypesListProps) {
  const { toast } = useToast();
  const [types, setTypes] = useState<DiscoveryType[]>(initialTypes);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const handleDelete = async (id: number, name: string) => {
    setDeletingId(id);
    const result = await deleteType(id);
    if (result.error) {
      toast({
        title: 'Erro ao Apagar Tipo',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Tipo Apagado!',
        description: `O tipo "${name}" foi removido com sucesso.`,
      });
      // Optimistic update
      setTypes(currentTypes => currentTypes.filter(type => type.id !== id));
    }
    setDeletingId(null);
  };

  if (types.length === 0) {
    return (
        <div className="text-center py-12 text-muted-foreground">
            <p className="font-semibold text-lg">Nenhum tipo encontrado.</p>
             <p>Comece por adicionar um novo tipo no formulário ao lado.</p>
        </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {types.map((type) => (
          <TableRow key={type.id}>
            <TableCell className="font-medium">{type.name}</TableCell>
            <TableCell className="text-right">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" disabled={deletingId === type.id}>
                            {deletingId === type.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Apagar o tipo &quot;{type.name}&quot; irá removê-lo permanentemente. Só é possível apagar tipos que não estejam a ser usados por nenhuma descoberta.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDelete(type.id, type.name)}
                            disabled={deletingId !== null}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            Sim, apagar tipo
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
