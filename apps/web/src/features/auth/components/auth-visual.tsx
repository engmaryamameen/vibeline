'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { authBanners } from '../assets/svg/banners';
import styles from './auth-visual.module.css';

const scenes = {
  login: {
    eyebrow: 'Your people, one calm place',
    title: 'Good conversations.',
    accent: 'Closer connections.',
    description:
      'A little hello. A shared idea. A plan for the weekend. Make room for the conversations that matter.',
    artwork: authBanners.login,
  },
  register: {
    eyebrow: 'For the everyday moments',
    title: 'A little hello.',
    accent: 'A lot of connection.',
    description:
      'From the big news to the little updates, keep your favorite people a conversation away.',
    artwork: authBanners.register,
  },
} as const;

export function AuthVisual() {
  const pathname = usePathname();
  const variant =
    pathname?.replace(/\/$/, '') === '/register' ? 'register' : 'login';
  const scene = scenes[variant];

  return (
    <aside
      className={styles.panel}
      data-variant={variant}
      aria-labelledby="auth-visual-title"
    >
      <div key={variant} className={styles.content}>
        <p className={styles.eyebrow}>
          <span className={styles.statusDot} aria-hidden="true" />
          {scene.eyebrow}
        </p>

        {/* Decorative sample conversations; no fake buttons or user data. */}
        <div className={styles.artwork} aria-hidden="true">
          <Image
            src={scene.artwork}
            alt=""
            width={800}
            height={560}
            unoptimized
            draggable={false}
            className={styles.image}
          />
        </div>

        <div className={styles.caption}>
          <h2 id="auth-visual-title" className={styles.title}>
            <span>{scene.title}</span>
            <span className={styles.accent}>{scene.accent}</span>
          </h2>
          <p className={styles.description}>{scene.description}</p>
          <span className={styles.finishingLine} aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}
