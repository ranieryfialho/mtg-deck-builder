import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditDeckModal({ deck, isOpen, onClose, onSave }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (deck) {
      setName(deck.name);
    }
  }, [deck]);

  const handleSave = () => {
    onSave(name);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Editar Nome do Deck</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3 bg-slate-700 border-slate-600"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}