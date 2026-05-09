/**
 * Props del `ConceptSidebar`.
 */
export interface ConceptSidebarProps {
  /**
   * Estado inicial del sidebar. Si es `true`, arranca colapsado mostrando
   * solo el icono de toggle. Default `false` (expandido).
   */
  defaultCollapsed?: boolean;
  className?: string;
}
