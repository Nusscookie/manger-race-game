/**
 * Raum-Server für „Der Weg zur Krippe“.
 *
 * Jeder Spielraum (Code wie „KMXP“) bekommt ein eigenes Durable Object. Es kennt keine Spielregeln,
 * sondern leitet nur Nachrichten weiter – die Spiellogik läuft wie bisher im Browser am Smartboard:
 *
 *   Spieler  → Server: rohe Nachricht            → weiter an die Spielleitung
 *   Host     → Server: {"z":"a","m":…}           → an alle Spieler als {"k":"a","m":…}
 *   Host     → Server: {"z":"p","id":"…","m":…}  → an einen Spieler als {"k":"p","m":…}
 *   "ping"   → "pong" (beantwortet Cloudflare selbst, ohne das Objekt aufzuwecken)
 *
 * Dank der „WebSocket Hibernation“ schläft das Objekt zwischen Nachrichten und kostet dann nichts.
 * Kostenloser Tarif: 100.000 Anfragen pro Tag; ankommende WebSocket-Nachrichten zählen nur 1/20.
 */
import { DurableObject } from 'cloudflare:workers';

export interface Env {
  RAUM: DurableObjectNamespace<Raum>;
}

/** Gleiche Regeln wie im Spiel: 4 Großbuchstaben (ohne I und O). */
const CODE_RE = /^[A-HJ-NP-Z]{4}$/;
const ID_RE = /^[A-Za-z0-9-]{1,40}$/;
const SCHLUESSEL_RE = /^[a-f0-9]{32}$/;

/** Schutz vor Missbrauch: mehr als genug für 35 Figuren plus Zuschauer. */
const MAX_VERBINDUNGEN = 80;
const MAX_SPIELER_NACHRICHT = 2_000;
const MAX_HOST_NACHRICHT = 100_000;
const FENSTER_MS = 10_000;
const MAX_SPIELER_PRO_FENSTER = 40;
const MAX_HOST_PRO_FENSTER = 400;
/** Gespeicherten Raumschlüssel löschen, wenn niemand mehr verbunden ist. */
const AUFRAEUMEN_MS = 12 * 60 * 60 * 1000;

interface Anhang {
  rolle: 'host' | 'spieler';
  id?: string;
}

function text(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/') return text('Der Weg zur Krippe – Raum-Server läuft.');

    const treffer = url.pathname.match(/^\/raum\/([A-Z]{4})$/);
    if (!treffer || !CODE_RE.test(treffer[1])) return text('Nicht gefunden', 404);
    if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return text('WebSocket erwartet', 426);

    const rolle = url.searchParams.get('rolle');
    if (rolle === 'host') {
      if (!SCHLUESSEL_RE.test(url.searchParams.get('schluessel') ?? '')) return text('Ungültiger Schlüssel', 400);
    } else if (rolle === 'spieler') {
      if (!ID_RE.test(url.searchParams.get('id') ?? '')) return text('Ungültige ID', 400);
    } else {
      return text('Unbekannte Rolle', 400);
    }

    const raum = env.RAUM.get(env.RAUM.idFromName(treffer[1]));
    return raum.fetch(req);
  },
} satisfies ExportedHandler<Env>;

function senden(ws: WebSocket, nachricht: string) {
  try {
    ws.send(nachricht);
  } catch {
    /* Verbindung gerade weg – der Client verbindet sich selbst neu */
  }
}

export class Raum extends DurableObject<Env> {
  /** Nachrichtenzähler pro Verbindung (geht beim Einschlafen verloren – das ist in Ordnung). */
  private zaehler = new Map<WebSocket, { start: number; n: number }>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const rolle = url.searchParams.get('rolle') === 'host' ? 'host' : 'spieler';

    if (this.ctx.getWebSockets().length >= MAX_VERBINDUNGEN) return this.ablehnen(4029, 'Raum voll');

    if (rolle === 'host') {
      // Wer den Raum zuerst als Spielleitung öffnet, bekommt ihn. Später darf nur, wer denselben
      // (im Browser gespeicherten) Schlüssel hat – z. B. nach dem Neuladen der Seite.
      const schluessel = url.searchParams.get('schluessel')!;
      const gespeichert = await this.ctx.storage.get<string>('schluessel');
      if (gespeichert && gespeichert !== schluessel) return this.ablehnen(4003, 'Raum gehört einer anderen Spielleitung');
      if (!gespeichert) await this.ctx.storage.put('schluessel', schluessel);
      if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(Date.now() + AUFRAEUMEN_MS);
    }

    const paar = new WebSocketPair();
    const [client, server] = Object.values(paar);
    const anhang: Anhang = rolle === 'host' ? { rolle } : { rolle, id: url.searchParams.get('id')! };
    this.ctx.acceptWebSocket(server, rolle === 'host' ? ['host'] : ['spieler', `p:${anhang.id}`]);
    server.serializeAttachment(anhang);
    return new Response(null, { status: 101, webSocket: client });
  }

  /** Verbindung annehmen und sofort mit Begründung schließen (der Browser sieht dann den Code). */
  private ablehnen(code: number, grund: string): Response {
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    server.close(code, grund);
    return new Response(null, { status: 101, webSocket: client });
  }

  private erlaubt(ws: WebSocket, rolle: Anhang['rolle']): boolean {
    const jetzt = Date.now();
    let z = this.zaehler.get(ws);
    if (!z || jetzt - z.start > FENSTER_MS) {
      z = { start: jetzt, n: 0 };
      this.zaehler.set(ws, z);
    }
    z.n++;
    return z.n <= (rolle === 'host' ? MAX_HOST_PRO_FENSTER : MAX_SPIELER_PRO_FENSTER);
  }

  async webSocketMessage(ws: WebSocket, nachricht: string | ArrayBuffer): Promise<void> {
    if (typeof nachricht !== 'string') return;
    const anhang = ws.deserializeAttachment() as Anhang | null;
    if (!anhang) return;
    if (!this.erlaubt(ws, anhang.rolle)) {
      ws.close(4008, 'Zu viele Nachrichten');
      return;
    }

    if (anhang.rolle === 'spieler') {
      if (nachricht.length > MAX_SPIELER_NACHRICHT) return;
      for (const host of this.ctx.getWebSockets('host')) senden(host, nachricht);
      return;
    }

    if (nachricht.length > MAX_HOST_NACHRICHT) return;
    let umschlag: { z?: unknown; id?: unknown; m?: unknown };
    try {
      umschlag = JSON.parse(nachricht);
    } catch {
      return;
    }
    if (umschlag.z === 'a') {
      const raus = JSON.stringify({ k: 'a', m: umschlag.m });
      for (const s of this.ctx.getWebSockets('spieler')) senden(s, raus);
    } else if (umschlag.z === 'p' && typeof umschlag.id === 'string' && ID_RE.test(umschlag.id)) {
      const raus = JSON.stringify({ k: 'p', m: umschlag.m });
      for (const s of this.ctx.getWebSockets(`p:${umschlag.id}`)) senden(s, raus);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, grund: string): Promise<void> {
    this.zaehler.delete(ws);
    try {
      // Codes 1005/1006 darf man selbst nicht senden – dann einfach normal schließen.
      ws.close(code === 1000 || (code >= 3000 && code < 5000) ? code : 1000, grund);
    } catch {
      /* schon zu */
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.zaehler.delete(ws);
  }

  /** Aufräumen: Schlüssel löschen, sobald niemand mehr im Raum ist. */
  async alarm(): Promise<void> {
    if (this.ctx.getWebSockets().length > 0) {
      await this.ctx.storage.setAlarm(Date.now() + 2 * 60 * 60 * 1000);
      return;
    }
    await this.ctx.storage.deleteAll();
  }
}
