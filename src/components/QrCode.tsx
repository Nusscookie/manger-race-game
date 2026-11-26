import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/** QR-Code wird lokal im Browser erzeugt – kein externer Dienst. */
export function QrCode({ text, className = '' }: { text: string; className?: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let aktiv = true;
    QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0a1230', light: '#ffffff' } })
      .then((s) => aktiv && setSvg(s))
      .catch(() => aktiv && setSvg(''));
    return () => {
      aktiv = false;
    };
  }, [text]);
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white p-3 [&>svg]:h-full [&>svg]:w-full ${className}`}
      role="img"
      aria-label={`QR-Code für ${text}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
