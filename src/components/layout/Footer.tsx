import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: '30px',
        padding: '20px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        backgroundColor: '#f8f8f8',
      }}
    >
      <p style={{ margin: '5px 0', color: '#666' }}>
        &copy; 2025 | e2517dev@gmail.com. Todos los derechos reservados.
      </p>
      <p style={{ margin: '5px 0' }}>
        <Link href="/legal#aviso-legal" style={{ color: 'var(--secondary-color)', textDecoration: 'none', margin: '0 15px' }}>
          Aviso Legal
        </Link>
        <Link href="/legal#condiciones-contratacion" style={{ color: 'var(--secondary-color)', textDecoration: 'none', margin: '0 15px' }}>
          Condiciones de contratación
        </Link>
        <Link href="/legal#contacto" style={{ color: 'var(--secondary-color)', textDecoration: 'none', margin: '0 15px' }}>
          Contacto
        </Link>
      </p>
    </footer>
  );
}