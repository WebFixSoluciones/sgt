import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'SGT Prevención | Gestor de Evaluaciones',
  description: 'Sistema de evaluación de riesgos psicosociales y prevención laboral SGT.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
