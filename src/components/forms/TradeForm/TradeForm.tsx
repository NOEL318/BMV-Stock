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
  recordTradeSchema,
  type RecordTradeFormInput,
  type RecordTradeInput,
} from "@/lib/schemas/trade";

import type { TradeFormProps } from "./TradeForm.types";

/**
 * Form para registrar un trade real ejecutado en GBM+.
 * Validación con Zod via react-hook-form.
 *
 * Usa `RecordTradeFormInput` como tipo de los campos del form (antes de la
 * coerción de Zod) y llama a `onSubmit` con `RecordTradeInput` (output parsed).
 */
export function TradeForm({
  onSubmit,
  defaultValues,
  showCancel = true,
  onCancel,
}: TradeFormProps) {
  const form = useForm<RecordTradeFormInput, unknown, RecordTradeInput>({
    resolver: zodResolver(recordTradeSchema),
    defaultValues: {
      ticker: "",
      exchange: "BMV",
      action: "BUY",
      quantity: 0,
      priceMxn: 0,
      commissionMxn: 0,
      executedAt: new Date(),
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
                <Input placeholder="WALMEX, AAPL, SPY..." {...field} />
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
                  value={field.value as string}
                  onValueChange={(val) => field.onChange(val)}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="BMV" id="exchange-bmv" />
                    <label htmlFor="exchange-bmv" className="text-sm">
                      BMV (México)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="SIC" id="exchange-sic" />
                    <label htmlFor="exchange-sic" className="text-sm">
                      SIC (Internacional)
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
                  value={field.value as string}
                  onValueChange={(val) => field.onChange(val)}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="BUY" id="action-buy" />
                    <label htmlFor="action-buy" className="text-sm">
                      Compra
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="SELL" id="action-sell" />
                    <label htmlFor="action-sell" className="text-sm">
                      Venta
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="DIVIDEND" id="action-div" />
                    <label htmlFor="action-div" className="text-sm">
                      Dividendo
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
                    placeholder="0"
                    {...field}
                    value={
                      Number.isFinite(field.value) && field.value !== 0
                        ? (field.value as number)
                        : ""
                    }
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
                <FormLabel>Precio (MXN)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={
                      Number.isFinite(field.value) && field.value !== 0
                        ? (field.value as number)
                        : ""
                    }
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="commissionMxn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comisión (MXN)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  value={(field.value as number | undefined) ?? 0}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="executedAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de ejecución</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ""}
                  onChange={(e) =>
                    field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  value={(field.value as string | null | undefined) ?? ""}
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
            {form.formState.isSubmitting ? "Guardando..." : "Registrar trade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
