"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  executePaperTradeSchema,
  type ExecutePaperTradeFormInput,
  type ExecutePaperTradeInput,
} from "@/lib/schemas/paperTrade";

/** Props del componente PaperTradeForm. */
export interface PaperTradeFormProps {
  /** Callback que recibe los datos validados al hacer submit. */
  onSubmit: (data: ExecutePaperTradeInput) => Promise<void>;
  /** Valores iniciales opcionales para los campos del form. */
  defaultValues?: Partial<ExecutePaperTradeInput>;
  /** Muestra el botón de cancelar. Default true. */
  showCancel?: boolean;
  /** Callback al presionar cancelar. */
  onCancel?: () => void;
}

/**
 * Form para ejecutar un paper trade (simulación). El precio se puede dejar
 * en null para que el server use el último precio del cache de cotizaciones.
 */
export function PaperTradeForm({
  onSubmit,
  defaultValues,
  showCancel = true,
  onCancel,
}: PaperTradeFormProps) {
  const form = useForm<ExecutePaperTradeFormInput, unknown, ExecutePaperTradeInput>({
    resolver: zodResolver(executePaperTradeSchema),
    defaultValues: {
      ticker: "",
      exchange: "BMV",
      action: "BUY",
      quantity: 0,
      priceMxn: null,
      notes: null,
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="ticker"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ticker</FormLabel>
              <FormControl>
                <Input placeholder="WALMEX, AAPL..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="exchange"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bolsa</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="BMV" id="paper-exchange-bmv" />
                    <label htmlFor="paper-exchange-bmv" className="text-sm">
                      BMV
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="SIC" id="paper-exchange-sic" />
                    <label htmlFor="paper-exchange-sic" className="text-sm">
                      SIC
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Operación</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="BUY" id="paper-buy" />
                    <label htmlFor="paper-buy" className="text-sm">
                      Compra
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="SELL" id="paper-sell" />
                    <label htmlFor="paper-sell" className="text-sm">
                      Venta
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.0001"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priceMxn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Usar precio actual"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? null : e.target.valueAsNumber)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          {showCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Ejecutando..." : "Ejecutar paper trade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
