
const colors = [
  { name: '--color-bg-page', value: '#F2F0EB' },
  { name: '--color-bg-sidebar', value: '#26262A' },
  { name: '--color-surface', value: '#FFFFFF' },
  { name: '--color-surface-sunken', value: '#FAF9F6' },
  { name: '--color-accent', value: '#F5B301' },
  { name: '--color-accent-hover', value: '#E5A800' },
  { name: '--color-accent-pressed', value: '#DDA000' },
  { name: '--color-success', value: '#2E9E5B' },
  { name: '--color-success-bg', value: '#E8F6ED' },
  { name: '--color-warning', value: '#D4760A' },
  { name: '--color-warning-bg', value: '#FBEEDC' },
  { name: '--color-error', value: '#D9483B' },
  { name: '--color-error-bg', value: '#FBE9E7' },
  { name: '--color-info', value: '#2B7EC1' },
  { name: '--color-info-bg', value: '#E7F1FA' },
  { name: '--color-text-primary', value: '#1C1C1E' },
  { name: '--color-text-primary-variant', value: '#3A3A3E' },
  { name: '--color-text-secondary', value: '#6B6B70' },
  { name: '--color-text-tertiary', value: '#8B8B92' },
  { name: '--color-text-disabled', value: '#B0ABA0' },
  { name: '--color-text-inverse', value: '#FFFFFF' },
  { name: '--color-text-inverse-muted', value: '#A0A0A8' },
  { name: '--color-border-light', value: '#EFEDE6' },
  { name: '--color-border', value: '#E5E1D8' },
  { name: '--color-border-hover', value: '#C4BFB3' },
  { name: '--color-border-input', value: '#D5D0C4' },
  { name: '--color-border-inverse', value: '#34343A' },
];

const typography = [
  { name: '--font-size-title', value: '24px', usage: 'Sayfa başlığı' },
  { name: '--font-size-heading', value: '15px', usage: 'Bölüm başlığı, kart başlığı' },
  { name: '--font-size-body', value: '13px', usage: 'Gövde metni — tabloda ve panelde kullanılan temel boyut' },
  { name: '--font-size-body-sm', value: '12px', usage: 'Küçük gövde metni — ikincil bilgi, alt metin' },
  { name: '--font-size-label', value: '11px', usage: 'Etiket — tablo başlıkları, rozet içi metinler' },
  { name: '--font-size-caption', value: '10px', usage: 'En küçük metin — input ipuçları, minik badge' },
];

const spacing = [
  { name: '--space-xs', value: '4px', usage: 'İkon-metin arası, çok yakın elemanlar' },
  { name: '--space-sm', value: '8px', usage: 'Buton içi yatay boşluk, küçük öğe aralıkları' },
  { name: '--space-md', value: '12px', usage: 'Liste öğeleri arası' },
  { name: '--space-lg', value: '16px', usage: 'Kart içi standart padding' },
  { name: '--space-xl', value: '24px', usage: 'Sayfa kenar boşlukları, ana bölümler arası' },
  { name: '--space-2xl', value: '32px', usage: 'Geniş bölüm aralıkları' },
  { name: '--space-3xl', value: '48px', usage: 'Çok geniş bölüm aralıkları' },
];

const radii = [
  { name: '--radius-sm', value: '4px', usage: 'Küçük öğeler — checkbox, scrollbar thumb, etiket' },
  { name: '--radius-md', value: '8px', usage: 'Orta öğeler — buton, input, menü dropdown' },
  { name: '--radius-lg', value: '12px', usage: 'Büyük öğeler — kart, modal, ana yüzey' },
  { name: '--radius-full', value: '999px', usage: 'Tam yuvarlak köşeler — hap butonlar, hap rozetler' },
  { name: '--radius-circle', value: '50%', usage: 'Daire şekli — avatar, nokta indikatör' },
];

export default function Styleguide() {
  return (
    <div>
      <h1 style={{ fontSize: 'var(--font-size-title)', fontWeight: 'var(--font-weight-bold)' }}>Styleguide</h1>
      
      <section style={{ marginTop: 'var(--space-2xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-heading)', marginBottom: 'var(--space-lg)' }}>Colors</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
          {colors.map((color) => (
            <div key={color.name} style={{ width: '150px', background: 'var(--color-surface)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ height: '50px', backgroundColor: `var(${color.name})`, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}></div>
              <div style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--font-size-label)', fontFamily: 'var(--font-family-mono)' }}>{color.name}</div>
              <div style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-text-tertiary)' }}>{color.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 'var(--space-2xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-heading)', marginBottom: 'var(--space-lg)' }}>Typography</h2>
        <table style={{ width: '100%', textAlign: 'left', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-sunken)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-label)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Token</th>
              <th style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-label)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Örnek Görünüm</th>
              <th style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-label)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Kullanım Alanı</th>
            </tr>
          </thead>
          <tbody>
            {typography.map((fs) => (
              <tr key={fs.name} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-label)', fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-primary-variant)' }}>
                  {fs.name} <br/> <span style={{color: 'var(--color-text-tertiary)'}}>({fs.value})</span>
                </td>
                <td style={{ padding: 'var(--space-md)', fontSize: `var(${fs.name})`, color: 'var(--color-text-primary)' }}>
                  The quick brown fox jumps over the lazy dog.
                </td>
                <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-body-sm)', color: 'var(--color-text-secondary)' }}>
                  {fs.usage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 'var(--space-2xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-heading)', marginBottom: 'var(--space-lg)' }}>Spacing</h2>
        <table style={{ width: '100%', textAlign: 'left', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-sunken)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-label)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Token</th>
              <th style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-label)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Görsel Boyut</th>
              <th style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-label)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Kullanım Alanı</th>
            </tr>
          </thead>
          <tbody>
            {spacing.map((sp) => (
              <tr key={sp.name} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-label)', fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-primary-variant)' }}>
                  {sp.name} <br/> <span style={{color: 'var(--color-text-tertiary)'}}>({sp.value})</span>
                </td>
                <td style={{ padding: 'var(--space-md)' }}>
                  <div style={{ width: `var(${sp.name})`, height: 'var(--space-lg)', background: 'var(--color-accent-hover)', borderRadius: 'var(--radius-sm)' }}></div>
                </td>
                <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-body-sm)', color: 'var(--color-text-secondary)' }}>
                  {sp.usage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 'var(--space-2xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-heading)', marginBottom: 'var(--space-lg)' }}>Border Radius</h2>
        <table style={{ width: '100%', textAlign: 'left', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-sunken)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-label)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Token</th>
              <th style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-label)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Görsel Örnek</th>
              <th style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-label)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Kullanım Alanı</th>
            </tr>
          </thead>
          <tbody>
            {radii.map((rd) => (
              <tr key={rd.name} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-label)', fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-primary-variant)' }}>
                  {rd.name} <br/> <span style={{color: 'var(--color-text-tertiary)'}}>({rd.value})</span>
                </td>
                <td style={{ padding: 'var(--space-md)' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--color-accent)', borderRadius: `var(${rd.name})`, border: '1px solid var(--color-border)' }}></div>
                </td>
                <td style={{ padding: 'var(--space-md)', fontSize: 'var(--font-size-body-sm)', color: 'var(--color-text-secondary)' }}>
                  {rd.usage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

