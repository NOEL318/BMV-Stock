import { z } from "zod";
import { es } from "zod/locales";

/**
 * Configura Zod para emitir sus mensajes de error en español.
 *
 * Importar este módulo por su efecto secundario (una sola vez, lo más arriba
 * posible en el árbol) hace que los formularios validados con `zodResolver`
 * muestren los errores en español en lugar del inglés por defecto.
 */
z.config(es());
