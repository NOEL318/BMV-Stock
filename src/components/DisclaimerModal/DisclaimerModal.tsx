"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserPreferences } from "@/hooks/useUserPreferences";

/**
 * Modal bloqueante que aparece al primer login si el usuario no ha aceptado
 * el disclaimer. Al aceptar, persiste `disclaimerAcceptedAt = now` y se cierra.
 * No tiene botón de cierre — el usuario debe marcar el checkbox y confirmar.
 */
export function DisclaimerModal() {
  const { data } = useUserPreferences();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Abrir solo si el usuario ya cargó y no ha aceptado el disclaimer.
  const open = !!data && data.preferences.disclaimerAcceptedAt === null;

  async function handleAccept(): Promise<void> {
    setSubmitting(true);
    try {
      const res = await fetch("/api/user-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disclaimerAcceptedAt: new Date().toISOString() }),
      });
      if (!res.ok) return;
      await queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Aviso importante antes de continuar</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            Este sistema es una <strong>herramienta educativa y de gestión personal</strong>. No
            constituye asesoría financiera, recomendación de inversión, ni intermediación bursátil.
          </p>
          <p>
            Las decisiones de inversión son responsabilidad exclusiva del usuario. Los datos de
            mercado provienen de fuentes públicas y pueden tener retraso o errores. El simulador de
            paper trading es una práctica con dinero ficticio; los resultados no garantizan
            resultados futuros con dinero real.
          </p>
          <p>
            Para asesoría profesional consulta a un asesor financiero certificado o a tu
            intermediario bursátil (en este caso, GBM México).
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="accept-disclaimer"
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v)}
          />
          <label htmlFor="accept-disclaimer" className="text-sm">
            Entiendo y acepto los términos.
          </label>
        </div>
        <Button onClick={handleAccept} disabled={!accepted || submitting} className="w-full">
          {submitting ? "Guardando..." : "Continuar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
