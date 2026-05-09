import React from "react";

// Mock de next/link para tests: reemplaza el componente con un anchor nativo
// para evitar la dependencia de RouterContext en el entorno de test (jsdom).
export default function MockLink(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string },
) {
  const { children, href, ...rest } = props;
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
