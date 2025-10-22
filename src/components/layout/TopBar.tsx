import Link from 'next/link';
import Image from 'next/image';

export default function TopBar() {
  return (
    <header className="top-bar">
      <Link href="/" className="logo">
        RANKU
        <Image
          src="/assets/ninja.png"
          alt="Ninja Ranku.es"
          width={35}
          height={24}
          className="logo-icon"
          style={{ height: 'auto' }} 
        />
      </Link>
      <div className="auth-buttons">
        <Link href="/auth" className="auth-button login-button">
          Log in
        </Link>
      </div>
    </header>
  );
}
