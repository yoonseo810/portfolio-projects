import type { LookupFailure, Step } from "./checkin";
import type { Cabin } from "./flights";
import type { SeatBlock, SeatKind } from "./seats";

export type Locale = "en" | "fr";
export const LOCALES: { id: Locale; label: string }[] = [
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
];

const en = {
  brandTag: "Self-service check-in",
  welcomeTitle: (airline: string) => `Welcome to ${airline}`,
  welcomeBody: "Check in, choose your seat and get your boarding pass in about a minute.",
  start: "Start check-in",
  chooseLanguage: "Language",
  startOver: "Start over",
  back: "Back",
  continue: "Continue",
  stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
  steps: { find: "Booking", passengers: "Travellers", seats: "Seats", bags: "Bags", review: "Confirm" } as Partial<Record<Step, string>>,

  findTitle: "Find your booking",
  findBody: "Enter the confirmation code from your itinerary and the last name of anyone on the booking.",
  codeLabel: "Confirmation code",
  codeHint: "6 letters and numbers",
  lastLabel: "Last name",
  findButton: "Find booking",
  lookupErrors: {
    not_found: {
      title: "We couldn't find that booking",
      body: "Check the confirmation code and last name, then try again.",
    },
    closed: {
      title: "Check-in has closed for this flight",
      body: "Check-in closes 45 minutes before departure. Please see an agent at the counter.",
    },
    all_checked_in: {
      title: "Everyone on this booking is checked in",
      body: "Your boarding passes are ready. Head to security, or see an agent to reprint them.",
    },
  } satisfies Record<LookupFailure, { title: string; body: string }>,
  samplesTitle: "Try a sample booking",
  samples: {
    family: "Family of three",
    premium: "Premium cabin",
    partial: "One already checked in",
    closed: "Check-in closed",
  },
  keyboard: "On-screen keyboard",
  backspace: "Delete",
  space: "Space",

  travellersTitle: "Who's checking in?",
  travellersBody: "Select everyone you're checking in now.",
  child: "Child",
  alreadyCheckedIn: (seat: string) => `Already checked in, seat ${seat}`,

  seatsTitle: "Choose seats",
  seatsBody: "We kept your group together. Tap a traveller, then tap a seat to change theirs.",
  seatFor: (name: string) => `Choosing a seat for ${name}`,
  noSeat: "No seat yet",
  cabin: { premium: "Premium", economy: "Economy" } satisfies Record<Cabin, string>,
  frontOfPlane: "Front of plane",
  seatMap: "Seat map",
  row: (n: number) => `Row ${n}`,
  legend: { open: "Available", taken: "Taken", yours: "Your group", exit: "Exit row" },
  kind: { window: "window", middle: "middle", aisle: "aisle" } satisfies Record<SeatKind, string>,
  seatLabel: (id: string, kind: string, status: string) => `Seat ${id}, ${kind}, ${status}`,
  seatStatus: {
    open: "available",
    exitOpen: "exit row, available",
    heldBy: (name: string) => `selected for ${name}`,
  },
  blocked: {
    taken: "taken",
    cabin: "other cabin",
    child_exit: "exit row, not for children",
  } satisfies Record<SeatBlock, string>,
  exitTitle: "Exit row seat",
  exitBody:
    "Travellers in an exit row must be 15 or older and willing and able to help open the exit in an emergency.",
  exitAgree: "I agree",
  exitCancel: "Pick another seat",

  bagsTitle: "Checked bags",
  bagsBody: "Up to 2 bags per traveller. Drop them at the bag counter after check-in.",
  bagCount: (n: number) => (n === 1 ? "1 bag" : `${n} bags`),
  addBag: (name: string) => `Add a bag for ${name}`,
  removeBag: (name: string) => `Remove a bag for ${name}`,

  reviewTitle: "Review and confirm",
  reviewBody: "Check the details below. You can go back to change anything.",
  flight: "Flight",
  departs: "Departs",
  boards: "Boarding",
  gate: "Gate",
  seat: "Seat",
  bags: "Bags",
  confirm: "Confirm check-in",
  confirming: "Checking in…",

  doneTitle: "You're checked in",
  doneBody: "Show these boarding passes at security and at the gate.",
  boardingPass: "Boarding pass",
  passFor: (name: string) => `Boarding pass for ${name}`,
  barcode: "Boarding pass barcode",
  from: "From",
  to: "To",
  finish: "Done",

  idleTitle: "Are you still there?",
  idleBody: (s: number) => `For your privacy, this kiosk will start over in ${s} seconds.`,
  stillHere: "I'm still here",
};

export type Messages = typeof en;

const fr: Messages = {
  brandTag: "Enregistrement libre-service",
  welcomeTitle: (airline) => `Bienvenue chez ${airline}`,
  welcomeBody: "Enregistrez-vous, choisissez votre siège et obtenez votre carte d'embarquement en une minute environ.",
  start: "Commencer l'enregistrement",
  chooseLanguage: "Langue",
  startOver: "Recommencer",
  back: "Retour",
  continue: "Continuer",
  stepOf: (n, total) => `Étape ${n} sur ${total}`,
  steps: { find: "Réservation", passengers: "Voyageurs", seats: "Sièges", bags: "Bagages", review: "Confirmation" },

  findTitle: "Trouver votre réservation",
  findBody: "Entrez le code de réservation de votre itinéraire et le nom de famille d'un voyageur de la réservation.",
  codeLabel: "Code de réservation",
  codeHint: "6 lettres et chiffres",
  lastLabel: "Nom de famille",
  findButton: "Trouver la réservation",
  lookupErrors: {
    not_found: {
      title: "Réservation introuvable",
      body: "Vérifiez le code de réservation et le nom de famille, puis réessayez.",
    },
    closed: {
      title: "L'enregistrement est fermé pour ce vol",
      body: "L'enregistrement ferme 45 minutes avant le départ. Veuillez vous adresser à un agent au comptoir.",
    },
    all_checked_in: {
      title: "Tous les voyageurs de cette réservation sont enregistrés",
      body: "Vos cartes d'embarquement sont prêtes. Rendez-vous à la sécurité, ou voyez un agent pour les réimprimer.",
    },
  },
  samplesTitle: "Essayez une réservation d'exemple",
  samples: {
    family: "Famille de trois",
    premium: "Cabine Premium",
    partial: "Un voyageur déjà enregistré",
    closed: "Enregistrement fermé",
  },
  keyboard: "Clavier à l'écran",
  backspace: "Effacer",
  space: "Espace",

  travellersTitle: "Qui s'enregistre?",
  travellersBody: "Sélectionnez toutes les personnes que vous enregistrez maintenant.",
  child: "Enfant",
  alreadyCheckedIn: (seat) => `Déjà enregistré, siège ${seat}`,

  seatsTitle: "Choisir les sièges",
  seatsBody: "Nous avons gardé votre groupe ensemble. Touchez un voyageur, puis un siège pour changer le sien.",
  seatFor: (name) => `Choix du siège pour ${name}`,
  noSeat: "Aucun siège",
  cabin: { premium: "Premium", economy: "Économie" },
  frontOfPlane: "Avant de l'avion",
  seatMap: "Plan des sièges",
  row: (n) => `Rangée ${n}`,
  legend: { open: "Libre", taken: "Occupé", yours: "Votre groupe", exit: "Rangée de sortie" },
  kind: { window: "hublot", middle: "milieu", aisle: "allée" },
  seatLabel: (id, kind, status) => `Siège ${id}, ${kind}, ${status}`,
  seatStatus: {
    open: "libre",
    exitOpen: "rangée de sortie, libre",
    heldBy: (name) => `choisi pour ${name}`,
  },
  blocked: {
    taken: "occupé",
    cabin: "autre cabine",
    child_exit: "rangée de sortie, interdite aux enfants",
  },
  exitTitle: "Siège en rangée de sortie",
  exitBody:
    "Les voyageurs assis dans une rangée de sortie doivent avoir 15 ans ou plus et être disposés et aptes à aider à ouvrir la sortie en cas d'urgence.",
  exitAgree: "J'accepte",
  exitCancel: "Choisir un autre siège",

  bagsTitle: "Bagages enregistrés",
  bagsBody: "Jusqu'à 2 bagages par voyageur. Déposez-les au comptoir des bagages après l'enregistrement.",
  bagCount: (n) => (n <= 1 ? `${n} bagage` : `${n} bagages`),
  addBag: (name) => `Ajouter un bagage pour ${name}`,
  removeBag: (name) => `Retirer un bagage pour ${name}`,

  reviewTitle: "Vérifier et confirmer",
  reviewBody: "Vérifiez les détails ci-dessous. Vous pouvez revenir en arrière pour les modifier.",
  flight: "Vol",
  departs: "Départ",
  boards: "Embarquement",
  gate: "Porte",
  seat: "Siège",
  bags: "Bagages",
  confirm: "Confirmer l'enregistrement",
  confirming: "Enregistrement…",

  doneTitle: "Vous êtes enregistré",
  doneBody: "Présentez ces cartes d'embarquement à la sécurité et à la porte.",
  boardingPass: "Carte d'embarquement",
  passFor: (name) => `Carte d'embarquement de ${name}`,
  barcode: "Code-barres de la carte d'embarquement",
  from: "De",
  to: "À",
  finish: "Terminer",

  idleTitle: "Êtes-vous toujours là?",
  idleBody: (s) => `Pour protéger vos renseignements, cette borne recommencera dans ${s} secondes.`,
  stillHere: "Je suis toujours là",
};

export const MESSAGES: Record<Locale, Messages> = { en, fr };

/** "14:05" in French, "2:05 PM" in English. */
export function formatTime(ms: number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", { hour: "numeric", minute: "2-digit" }).format(ms);
}
