'use client';

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  centered = true,
  theme = 'light',
  className = '',
  style = {}
}) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`section-header-group ${className}`}
      style={{
        textAlign: centered ? 'center' : 'left',
        marginBottom: '2.5rem',
        ...style
      }}
    >
      {eyebrow && (
        <span
          className="section-eyebrow"
          style={{
            color: isDark ? 'var(--color-text-accent-inv, #E5C358)' : 'var(--saffron-dark, #C05621)',
            letterSpacing: '0.5px',
            textTransform: 'none',
            fontSize: 'var(--text-sm, 0.875rem)',
            fontWeight: 600,
            display: 'inline-block',
            marginBottom: '6px'
          }}
        >
          {eyebrow}
        </span>
      )}

      <h2
        className="section-main-title"
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'var(--text-2xl, 2.2rem)',
          color: isDark ? '#FFFFFF' : 'var(--color-text-primary, #1A1918)',
          margin: '0 0 10px 0',
          lineHeight: 1.25,
          fontWeight: 700
        }}
      >
        {title}
      </h2>

      <div
        className="gold-line"
        style={{
          margin: centered ? '0 auto 14px auto' : '0 0 14px 0'
        }}
      />

      {subtitle && (
        <p
          className="section-subtitle"
          style={{
            color: isDark ? 'rgba(255,255,255,0.85)' : 'var(--color-text-muted, #6B655B)',
            fontSize: 'var(--text-base, 1rem)',
            maxWidth: '680px',
            margin: centered ? '0 auto' : '0',
            lineHeight: 1.6
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
