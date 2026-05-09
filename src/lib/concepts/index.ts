import { CONCEPTS, type ConceptDefinition } from "./definitions";

export { CONCEPTS };
export type { ConceptDefinition };

/**
 * Lookup síncrono por slug. Regresa undefined si no existe (el caller decide
 * cómo manejar conceptos desconocidos).
 *
 * @param slug - identificador del concepto en kebab-case
 * @returns la definición del concepto, o undefined si el slug no existe
 */
export function findConcept(slug: string): ConceptDefinition | undefined {
  return CONCEPTS[slug];
}
