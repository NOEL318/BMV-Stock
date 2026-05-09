import type { RecordTradeInput } from "@/lib/schemas/trade";

/**
 * Props del formulario para registrar un trade ejecutado en GBM+.
 */
export interface TradeFormProps {
  /**
   * Acción al submit. El componente padre se encarga del POST a la API.
   * Recibe los datos validados.
   */
  onSubmit: (data: RecordTradeInput) => Promise<void>;
  /** Valores iniciales (útil para edición en el futuro). */
  defaultValues?: Partial<RecordTradeInput>;
  /** Mostrar el botón cancel. Default `true`. */
  showCancel?: boolean;
  /** Callback del botón cancel. */
  onCancel?: () => void;
}
