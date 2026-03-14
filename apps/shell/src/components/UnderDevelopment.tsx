interface Props {
  name: string;
  icon: string;
  color: string;
  bg: string;
}

export function UnderDevelopment({ name, icon, color, bg }: Props) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      background: 'var(--color-bg-2)',
      padding: 48,
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        color,
      }}>
        {icon}
      </div>
      <h1 style={{
        fontSize: 24,
        fontWeight: 700,
        color: 'var(--color-text)',
        margin: 0,
      }}>
        {name}
      </h1>
      <p style={{
        fontSize: 15,
        color: 'var(--color-text-3)',
        margin: 0,
        maxWidth: 360,
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        This app is under active development and will be available soon.
      </p>
      <div style={{
        marginTop: 8,
        padding: '8px 20px',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--color-text-muted)',
      }}>
        Coming soon
      </div>
    </div>
  );
}
