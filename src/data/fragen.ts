/**
 * Fragen für „Der Weg zur Krippe“.
 *
 * - Stellenangaben nach Lutherbibel 2017.
 * - Die richtige Antwort steht hier zur leichteren Kontrolle immer an erster Stelle
 *   (richtig: 0). Im Spiel werden Fragen und Antworten zufällig gemischt.
 * - Fragen mit dem Kommentar „PRÜFEN“ bitte vor dem Einsatz noch einmal kontrollieren.
 * - Die ersten 16 Fragen sind von der SMV bereits geprüft.
 */

export type Kategorie = 'Lukas' | 'Matthäus' | 'Mythos' | 'Hintergrund';

export interface Frage {
  frage: string;
  antworten: [string, string, string, string];
  /** Index der richtigen Antwort in `antworten` */
  richtig: 0 | 1 | 2 | 3;
  stelle: string;
  erklaerung: string;
  kategorie: Kategorie;
}

export const FRAGEN: Frage[] = [
  // ───────────── Bereits geprüft (SMV) ─────────────
  {
    frage: 'Welcher Kaiser ordnete die Volkszählung an?',
    antworten: ['Augustus', 'Tiberius', 'Nero', 'Claudius'],
    richtig: 0,
    stelle: 'Lk 2,1',
    erklaerung: 'Kaiser Augustus ließ das ganze Reich schätzen – deshalb mussten Maria und Josef auf die Reise.',
    kategorie: 'Hintergrund',
  },
  {
    frage: 'Wer war damals Statthalter in Syrien?',
    antworten: ['Quirinius', 'Pontius Pilatus', 'Felix', 'Festus'],
    richtig: 0,
    stelle: 'Lk 2,2',
    erklaerung: 'Lukas datiert die Schätzung auf die Zeit, als Quirinius Statthalter in Syrien war.',
    kategorie: 'Hintergrund',
  },
  {
    frage: 'In welcher Stadt lebten Maria und Josef vor der Reise?',
    antworten: ['Nazareth', 'Jerusalem', 'Kapernaum', 'Betanien'],
    richtig: 0,
    stelle: 'Lk 2,4',
    erklaerung: 'Josef machte sich von Nazareth in Galiläa auf den Weg nach Bethlehem.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Warum musste Josef nach Bethlehem?',
    antworten: [
      'Er stammte aus dem Haus und Geschlecht Davids',
      'Er hatte dort Arbeit als Zimmermann',
      'Marias Familie wohnte dort',
      'Er wollte dort im Tempel beten',
    ],
    richtig: 0,
    stelle: 'Lk 2,4',
    erklaerung: 'Zur Schätzung ging jeder in die Stadt seiner Vorfahren – bei Josef war das Bethlehem, die Stadt Davids.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Wohin legte Maria das neugeborene Kind?',
    antworten: ['In eine Krippe', 'In eine Wiege', 'In einen Korb aus Schilf', 'In ein Bett der Herberge'],
    richtig: 0,
    stelle: 'Lk 2,7',
    erklaerung: 'Maria wickelte ihr Kind in Windeln und legte es in eine Futterkrippe.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Wem verkündete ein Engel zuerst die Geburt?',
    antworten: ['Hirten auf dem Feld', 'Den Weisen aus dem Morgenland', 'König Herodes', 'Den Priestern im Tempel'],
    richtig: 0,
    stelle: 'Lk 2,8–10',
    erklaerung: 'Die ersten, die von der Geburt erfuhren, waren einfache Hirten, die nachts ihre Herde hüteten.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Was war laut Engel das Zeichen für die Hirten?',
    antworten: [
      'Ein Kind in Windeln gewickelt, in einer Krippe liegend',
      'Ein heller Stern über einem Stall',
      'Ein Kind mit einer goldenen Krone',
      'Ein Esel vor einer offenen Tür',
    ],
    richtig: 0,
    stelle: 'Lk 2,12',
    erklaerung: 'Das Zeichen war ganz unscheinbar: ein Neugeborenes in Windeln, das in einer Krippe liegt.',
    kategorie: 'Lukas',
  },
  {
    // PRÜFEN (nur die Erklärung: Hinweis auf Jes 1,3)
    frage: 'Werden Ochs und Esel in der Weihnachtsgeschichte erwähnt?',
    antworten: [
      'Nein, das ist spätere Tradition',
      'Ja, bei Lukas stehen sie an der Krippe',
      'Ja, bei Matthäus kommen sie mit den Weisen',
      'Nur der Esel, auf dem Maria reitet',
    ],
    richtig: 0,
    stelle: 'Lk 2; Mt 2',
    erklaerung: 'Weder Lukas noch Matthäus nennen Tiere an der Krippe; Ochs und Esel kamen später dazu, angeregt durch Jesaja 1,3.',
    kategorie: 'Mythos',
  },
  {
    frage: 'Wie viele Weise aus dem Morgenland nennt Matthäus?',
    antworten: ['Er nennt keine Zahl', 'Drei', 'Zwei', 'Zwölf'],
    richtig: 0,
    stelle: 'Mt 2,1',
    erklaerung: 'Matthäus nennt keine Zahl – die „drei“ wurde später aus den drei Geschenken abgeleitet.',
    kategorie: 'Mythos',
  },
  {
    frage: 'Welche Geschenke brachten die Weisen?',
    antworten: ['Gold, Weihrauch und Myrrhe', 'Gold, Silber und Edelsteine', 'Weihrauch, Öl und Wein', 'Brot, Salz und Wein'],
    richtig: 0,
    stelle: 'Mt 2,11',
    erklaerung: 'Die Weisen öffneten ihre Schätze und schenkten dem Kind Gold, Weihrauch und Myrrhe.',
    kategorie: 'Matthäus',
  },
  {
    frage: 'Welcher König erschrak über die Frage der Weisen?',
    antworten: ['Herodes', 'Augustus', 'David', 'Salomo'],
    richtig: 0,
    stelle: 'Mt 2,3',
    erklaerung: 'König Herodes erschrak, als die Weisen nach einem neugeborenen König der Juden fragten – mit ihm ganz Jerusalem.',
    kategorie: 'Matthäus',
  },
  {
    frage: 'Wo fanden die Weisen das Kind laut Matthäus?',
    antworten: ['In einem Haus', 'In einem Stall', 'In einer Höhle', 'Im Tempel in Jerusalem'],
    richtig: 0,
    stelle: 'Mt 2,11',
    erklaerung: 'Bei Matthäus gehen die Weisen in ein Haus und finden dort das Kind mit Maria.',
    kategorie: 'Mythos',
  },
  {
    frage: 'Wohin floh die Familie vor Herodes?',
    antworten: ['Nach Ägypten', 'Nach Nazareth', 'Nach Babylon', 'Nach Damaskus'],
    richtig: 0,
    stelle: 'Mt 2,13–14',
    erklaerung: 'Ein Engel warnte Josef im Traum, und er floh in der Nacht mit Maria und dem Kind nach Ägypten.',
    kategorie: 'Matthäus',
  },
  {
    frage: 'Welcher Engel kündigte Maria die Geburt an?',
    antworten: ['Gabriel', 'Michael', 'Raphael', 'Uriel'],
    richtig: 0,
    stelle: 'Lk 1,26–31',
    erklaerung: 'Gott sandte den Engel Gabriel nach Nazareth zu Maria.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Welchen Namen sollte das Kind laut Engel bekommen?',
    antworten: ['Jesus', 'Johannes', 'David', 'Josef'],
    richtig: 0,
    stelle: 'Mt 1,21',
    erklaerung: 'Der Engel sagte Josef, er solle dem Sohn den Namen Jesus geben, denn er werde sein Volk retten.',
    kategorie: 'Matthäus',
  },
  {
    frage: 'Am wievielten Tag wurde das Kind beschnitten und benannt?',
    antworten: ['Am achten Tag', 'Am ersten Tag', 'Am dritten Tag', 'Am vierzigsten Tag'],
    richtig: 0,
    stelle: 'Lk 2,21',
    erklaerung: 'Nach acht Tagen wurde das Kind beschnitten und bekam den Namen Jesus, wie es der Engel gesagt hatte.',
    kategorie: 'Lukas',
  },

  // ───────────── Lukas 1–2 ─────────────
  {
    frage: 'Wie hieß der Vater von Johannes dem Täufer?',
    antworten: ['Zacharias', 'Simeon', 'Josef', 'Eli'],
    richtig: 0,
    stelle: 'Lk 1,5.13',
    erklaerung: 'Der Priester Zacharias und seine Frau Elisabeth bekamen im Alter noch einen Sohn: Johannes.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Wie hieß Marias Verwandte, die ebenfalls ein Kind erwartete?',
    antworten: ['Elisabeth', 'Hanna', 'Martha', 'Salome'],
    richtig: 0,
    stelle: 'Lk 1,36',
    erklaerung: 'Der Engel erzählte Maria, dass auch ihre Verwandte Elisabeth trotz ihres Alters schwanger war.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Was geschah, als Maria ihre Verwandte Elisabeth besuchte?',
    antworten: [
      'Das Kind in Elisabeths Bauch hüpfte vor Freude',
      'Über dem Haus erschien ein Stern',
      'Zacharias konnte sofort wieder sprechen',
      'Ein Engel erschien den beiden Frauen',
    ],
    richtig: 0,
    stelle: 'Lk 1,41–44',
    erklaerung: 'Als Elisabeth Marias Gruß hörte, hüpfte das Kind in ihrem Leib – und sie wurde vom Heiligen Geist erfüllt.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Warum lag das Kind in einer Krippe?',
    antworten: [
      'In der Herberge war kein Raum für sie',
      'Josef hatte einen Stall gekauft',
      'Sie versteckten sich vor Herodes',
      'Das war damals so Brauch',
    ],
    richtig: 0,
    stelle: 'Lk 2,7',
    erklaerung: 'Lukas schreibt nur knapp, dass für sie kein Platz in der Herberge war.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Womit lobte die Menge der Engel Gott?',
    antworten: [
      '„Ehre sei Gott in der Höhe“',
      '„Hosianna dem Sohn Davids“',
      '„Heilig, heilig, heilig“',
      '„Der Herr ist auferstanden“',
    ],
    richtig: 0,
    stelle: 'Lk 2,13–14',
    erklaerung: 'Die himmlischen Heerscharen lobten Gott und wünschten den Menschen Frieden auf Erden.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Was taten die Hirten, nachdem sie das Kind gesehen hatten?',
    antworten: [
      'Sie erzählten weiter, was sie gehört hatten',
      'Sie blieben für immer beim Kind',
      'Sie zogen mit der Familie nach Ägypten',
      'Sie meldeten es König Herodes',
    ],
    richtig: 0,
    stelle: 'Lk 2,17–20',
    erklaerung: 'Die Hirten verbreiteten die Botschaft, und alle wunderten sich; dann kehrten sie zurück und lobten Gott.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Wer erkannte das Kind im Tempel als den Retter, auf den er gewartet hatte?',
    antworten: ['Simeon', 'Zacharias', 'Kaiphas', 'Nikodemus'],
    richtig: 0,
    stelle: 'Lk 2,25–32',
    erklaerung: 'Der alte Simeon nahm das Kind in die Arme und dankte Gott, dass er den Heiland noch sehen durfte.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Wie hieß die alte Prophetin, die im Tempel von dem Kind erzählte?',
    antworten: ['Hanna', 'Debora', 'Mirjam', 'Elisabeth'],
    richtig: 0,
    stelle: 'Lk 2,36–38',
    erklaerung: 'Die hochbetagte Prophetin Hanna pries Gott und sprach zu allen, die auf die Erlösung warteten, von dem Kind.',
    kategorie: 'Lukas',
  },
  {
    frage: 'Wie nennt der Engel das Kind, als er zu den Hirten spricht?',
    antworten: ['Heiland, Christus, der Herr', 'König der Juden', 'Prophet aus Nazareth', 'Sohn des Kaisers'],
    richtig: 0,
    stelle: 'Lk 2,11',
    erklaerung: 'Der Engel verkündet: Heute ist in der Stadt Davids der Heiland geboren – Christus, der Herr.',
    kategorie: 'Lukas',
  },

  // ───────────── Matthäus 1–2 ─────────────
  {
    frage: 'Was wollte Josef zuerst tun, als er erfuhr, dass Maria ein Kind erwartete?',
    antworten: [
      'Sie heimlich verlassen',
      'Sie öffentlich anklagen',
      'Sie sofort heiraten',
      'Mit ihr nach Ägypten ziehen',
    ],
    richtig: 0,
    stelle: 'Mt 1,19',
    erklaerung: 'Josef wollte Maria nicht bloßstellen und dachte daran, sie still und heimlich zu verlassen.',
    kategorie: 'Matthäus',
  },
  {
    frage: 'Wie erfuhr Josef, dass er Maria zu sich nehmen soll?',
    antworten: [
      'Ein Engel erschien ihm im Traum',
      'Maria schrieb ihm einen Brief',
      'Ein Prophet sagte es ihm im Tempel',
      'Die Hirten erzählten es ihm',
    ],
    richtig: 0,
    stelle: 'Mt 1,20–24',
    erklaerung: 'Ein Engel des Herrn sprach im Traum zu Josef – und Josef tat, was der Engel ihm gesagt hatte.',
    kategorie: 'Matthäus',
  },
  {
    frage: 'Was bedeutet der Name „Immanuel“?',
    antworten: ['Gott mit uns', 'Gott ist König', 'Licht der Welt', 'Sohn des Friedens'],
    richtig: 0,
    stelle: 'Mt 1,23',
    erklaerung: 'Matthäus zitiert den Propheten Jesaja und übersetzt den Namen gleich mit: Gott mit uns.',
    kategorie: 'Matthäus',
  },
  {
    frage: 'Wo fragten die Weisen zuerst nach dem neugeborenen König?',
    antworten: ['In Jerusalem', 'In Bethlehem', 'In Nazareth', 'In Rom'],
    richtig: 0,
    stelle: 'Mt 2,1–2',
    erklaerung: 'Die Weisen kamen zuerst nach Jerusalem, in die Hauptstadt, und fragten dort nach dem König der Juden.',
    kategorie: 'Matthäus',
  },
  {
    // PRÜFEN (Verszählung Micha 5,1 in der Lutherbibel)
    frage: 'Woher wussten die Schriftgelehrten, dass der Messias in Bethlehem geboren wird?',
    antworten: [
      'Aus einem Prophetenwort',
      'Aus einem Brief des Kaisers',
      'Aus einem Traum des Herodes',
      'Von den Hirten',
    ],
    richtig: 0,
    stelle: 'Mt 2,4–6',
    erklaerung: 'Sie verwiesen auf den Propheten (Micha 5,1), der Bethlehem als Herkunftsort des künftigen Herrschers nennt.',
    kategorie: 'Matthäus',
  },
  {
    frage: 'Warum zogen die Weisen auf einem anderen Weg wieder heim?',
    antworten: [
      'Gott warnte sie im Traum vor Herodes',
      'Der Stern war verschwunden',
      'Josef bat sie darum',
      'Die Straße war überschwemmt',
    ],
    richtig: 0,
    stelle: 'Mt 2,12',
    erklaerung: 'Im Traum erhielten die Weisen den Befehl, nicht zu Herodes zurückzukehren.',
    kategorie: 'Matthäus',
  },
  {
    frage: 'Wo ließ sich die Familie nach der Rückkehr aus Ägypten nieder?',
    antworten: ['In Nazareth in Galiläa', 'In Bethlehem', 'In Jerusalem', 'In Jericho'],
    richtig: 0,
    stelle: 'Mt 2,22–23',
    erklaerung: 'Aus Furcht vor dem neuen Herrscher in Judäa zog Josef nach Galiläa und wohnte in Nazareth.',
    kategorie: 'Matthäus',
  },

  // ───────────── „Steht das wirklich in der Bibel?“ ─────────────
  {
    frage: 'Steht in der Bibel, dass Maria auf einem Esel nach Bethlehem ritt?',
    antworten: [
      'Nein, ein Esel wird nicht erwähnt',
      'Ja, bei Lukas',
      'Ja, bei Matthäus',
      'Ja, aber es war ein Kamel',
    ],
    richtig: 0,
    stelle: 'Lk 2,4–5',
    erklaerung: 'Lukas erzählt nur, dass Josef mit Maria hinaufzog – über ein Reittier sagt er nichts.',
    kategorie: 'Mythos',
  },
  {
    frage: 'Nennt die Bibel die Weisen aus dem Morgenland „Könige“?',
    antworten: [
      'Nein, sie heißen Weise bzw. Sterndeuter',
      'Ja, die Heiligen Drei Könige',
      'Ja, Könige aus Persien',
      'Ja, aber nur einen von ihnen',
    ],
    richtig: 0,
    stelle: 'Mt 2,1',
    erklaerung: 'Matthäus spricht von Weisen aus dem Osten, also Sterndeutern; zu Königen wurden sie erst in der späteren Tradition.',
    kategorie: 'Mythos',
  },
  {
    frage: 'Stehen die Namen Caspar, Melchior und Balthasar in der Bibel?',
    antworten: ['Nein, sie kamen erst später auf', 'Ja, bei Matthäus', 'Ja, bei Lukas', 'Nur Melchior'],
    richtig: 0,
    stelle: 'Mt 2,1–12',
    erklaerung: 'Matthäus nennt keine Namen; Caspar, Melchior und Balthasar stammen aus der späteren Überlieferung.',
    kategorie: 'Mythos',
  },
  {
    frage: 'Nennt die Bibel ein Datum für die Geburt Jesu?',
    antworten: [
      'Nein, es wird kein Datum genannt',
      'Ja, Lukas nennt den 24. Dezember',
      'Ja, Matthäus nennt den 25. Dezember',
      'Ja, den ersten Tag des Jahres',
    ],
    richtig: 0,
    stelle: 'Lk 2,1–7',
    erklaerung: 'Lukas verortet die Geburt nur zur Zeit von Augustus und Quirinius; der 25. Dezember wurde später als Festtag gewählt.',
    kategorie: 'Mythos',
  },

  // ───────────── Hintergrund ─────────────
  {
    frage: 'Welcher berühmte König Israels stammte ebenfalls aus Bethlehem?',
    antworten: ['David', 'Salomo', 'Saul', 'Herodes'],
    richtig: 0,
    stelle: '1 Sam 16,1–13; Lk 2,4',
    erklaerung: 'Der Hirtenjunge David wurde in Bethlehem zum König gesalbt – darum heißt Bethlehem „Stadt Davids“.',
    kategorie: 'Hintergrund',
  },
  {
    frage: 'Von wo nach wo führte die Reise von Maria und Josef?',
    antworten: ['Von Galiläa nach Judäa', 'Von Judäa nach Galiläa', 'Von Ägypten nach Galiläa', 'Von Syrien nach Rom'],
    richtig: 0,
    stelle: 'Lk 2,4',
    erklaerung: 'Sie zogen aus Nazareth in Galiläa hinauf ins jüdische Land nach Bethlehem.',
    kategorie: 'Hintergrund',
  },
  {
    frage: 'Was gab Herodes vor, als er die Weisen nach Bethlehem schickte?',
    antworten: [
      'Er wolle das Kind auch anbeten',
      'Er wolle das Kind zum Nachfolger machen',
      'Er wolle Gold für das Kind spenden',
      'Er wolle den Stern selbst sehen',
    ],
    richtig: 0,
    stelle: 'Mt 2,7–8',
    erklaerung: 'Herodes befragte die Weisen heimlich und behauptete, er wolle ebenfalls kommen und das Kind anbeten.',
    kategorie: 'Hintergrund',
  },
  {
    frage: 'Wer herrschte nach Herodes in Judäa, sodass Josef sich fürchtete, dorthin zu gehen?',
    antworten: ['Archelaus', 'Herodes Antipas', 'Pontius Pilatus', 'Quirinius'],
    richtig: 0,
    stelle: 'Mt 2,22',
    erklaerung: 'Als Josef hörte, dass Archelaus anstelle seines Vaters Herodes regierte, zog er lieber nach Galiläa.',
    kategorie: 'Hintergrund',
  },
];
