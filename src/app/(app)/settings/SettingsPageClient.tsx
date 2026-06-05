"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import type { UpdateUserPreferencesInput } from "@/lib/schemas/userPreferences";

/**
 * Client Component del formulario de ajustes del usuario.
 * Carga las preferencias actuales con `useUserPreferences`, permite editar
 * moneda, tema, densidad de tablas y perfil de riesgo, y hace PUT a
 * `/api/user-preferences` al guardar. El botón Guardar está deshabilitado
 * mientras no haya cambios (isDirty es false).
 */
export function SettingsPageClient() {
  const { data, isLoading, error, refetch } = useUserPreferences();
  const { setTheme } = useTheme();
  const queryClient = useQueryClient();
  const form = useForm<UpdateUserPreferencesInput>({
    defaultValues: {},
  });

  // Resetear el form cuando llegan los datos del servidor.
  useEffect(() => {
    if (data) {
      form.reset({
        displayCurrency: data.preferences.displayCurrency,
        defaultTimeframe: data.preferences.defaultTimeframe,
        theme: data.preferences.theme,
        tableDensity: data.preferences.tableDensity,
        riskProfile: data.preferences.riskProfile,
      });
    }
  }, [data, form]);

  /** Envía el patch al servidor y actualiza el tema inmediatamente si cambió. */
  async function handleSubmit(values: UpdateUserPreferencesInput): Promise<void> {
    const res = await fetch("/api/user-preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      toast.error("Error al guardar");
      return;
    }
    // Aplicar el tema inmediatamente sin esperar al siguiente ciclo.
    if (values.theme) setTheme(values.theme);
    await queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    toast.success("Ajustes guardados");
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Cargando...</p>;
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center">
          <p className="text-destructive text-sm">No se pudieron cargar tus preferencias.</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencias</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Field label="Moneda de display">
            <RadioGroup
              value={form.watch("displayCurrency")}
              onValueChange={(v) =>
                form.setValue("displayCurrency", v as "MXN" | "USD", { shouldDirty: true })
              }
              className="flex gap-3"
            >
              <Option value="MXN" label="Pesos (MXN)" />
              <Option value="USD" label="Dólares (USD)" />
            </RadioGroup>
          </Field>

          <Field label="Tema">
            <RadioGroup
              value={form.watch("theme")}
              onValueChange={(v) =>
                form.setValue("theme", v as "light" | "dark" | "system", { shouldDirty: true })
              }
              className="flex gap-3"
            >
              <Option value="light" label="Claro" />
              <Option value="dark" label="Oscuro" />
              <Option value="system" label="Sistema" />
            </RadioGroup>
          </Field>

          <Field label="Densidad de tablas">
            <RadioGroup
              value={form.watch("tableDensity")}
              onValueChange={(v) =>
                form.setValue("tableDensity", v as "compact" | "comfortable", {
                  shouldDirty: true,
                })
              }
              className="flex gap-3"
            >
              <Option value="compact" label="Compacta" />
              <Option value="comfortable" label="Cómoda" />
            </RadioGroup>
          </Field>

          <Field label="Perfil de riesgo">
            <RadioGroup
              value={form.watch("riskProfile")}
              onValueChange={(v) =>
                form.setValue("riskProfile", v as "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE", {
                  shouldDirty: true,
                })
              }
              className="flex gap-3"
            >
              <Option value="CONSERVATIVE" label="Conservador" />
              <Option value="MODERATE" label="Moderado" />
              <Option value="AGGRESSIVE" label="Agresivo" />
            </RadioGroup>
          </Field>

          <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
            Guardar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** Contenedor de campo con etiqueta. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

/** Opción individual para RadioGroup con su etiqueta. */
function Option({ value, label }: { value: string; label: string }) {
  const id = `setting-${value}`;
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem value={value} id={id} />
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
    </div>
  );
}
