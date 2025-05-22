import { useEffect, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { parseISO, format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ReactDOM from "react-dom";

// Définition de l'URL de base de l'API
const BASE_URL = 'https://www.backend.lnb-intranet.globalitnet.org';

const locales = { fr };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
  getDay,
  locales,
});

function Modal({ open, onClose, children }: { open: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-green-900 rounded-xl shadow-xl p-6 min-w-[340px] max-w-5xl w-full relative border border-gray-100 dark:border-green-800">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          onClick={onClose}
          aria-label="Fermer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

const couleurToHex = (couleur: string) => {
  if (couleur?.startsWith('#')) return couleur;
  if (couleur === 'rouge') return '#ff0000';
  if (couleur === 'bleu') return '#0000ff';
  if (couleur === 'vert') return '#00ff00';
  if (couleur === 'jaune') return '#ffe600';
  return '#3174ad';
};

function EventForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: AgendaEventResource | SlotInfo;
  onSubmit: (data: AgendaEventResource) => void;
  loading?: boolean;
}) {
  const [form, setForm] = useState<AgendaEventResource>(
    (initial as AgendaEventResource) || {
      titre: '',
      description: '',
      date_debut: '',
      date_fin: '',
      toute_la_journee: false,
      rappel: '',
      recurrence: '',
      priorite: 'moyenne',
      couleur: 'bleu',
      lieu: '',
      participants: '',
      accompli: false,
      utilisateur: 1,
    }
  );

  useEffect(() => {
    if (initial) setForm(initial as AgendaEventResource);
  }, [initial]);

  return (
    <form
      className="bg-white dark:bg-green-900 w-full mx-auto rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
      onSubmit={e => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      {/* Colonne 1 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Titre</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-green-800 dark:border-green-700 dark:text-white"
            placeholder="Réunion équipe..."
            required
            value={String(form.titre ?? '')}
            onChange={e => setForm({ ...form, titre: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-green-800 dark:border-green-700 dark:text-white"
            placeholder="Détails de l'événement..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Lieu</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-green-800 dark:border-green-700 dark:text-white"
            placeholder="Salle, visioconférence..."
            value={form.lieu}
            onChange={e => setForm({ ...form, lieu: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Participants</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-green-800 dark:border-green-700 dark:text-white"
            placeholder="Emails séparés par des virgules"
            value={form.participants}
            onChange={e => setForm({ ...form, participants: e.target.value })}
          />
        </div>
      </div>

      {/* Colonne 2 */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Début</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-green-800 dark:border-green-700 dark:text-white"
              required
              value={form.date_debut ? form.date_debut.slice(0, 16) : ''}
              onChange={e => setForm({ ...form, date_debut: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fin</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-green-800 dark:border-green-700 dark:text-white"
              required
              value={form.date_fin ? form.date_fin.slice(0, 16) : ''}
              onChange={e => setForm({ ...form, date_fin: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            checked={Boolean(form.toute_la_journee)}
            onChange={e => setForm({ ...form, toute_la_journee: e.target.checked })}
          />
          <label className="text-sm text-gray-700 dark:text-gray-200">Toute la journée</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Rappel</label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-green-800 dark:border-green-700 dark:text-white"
            placeholder="Rappel"
            value={typeof form.rappel === 'string' ? form.rappel.slice(0, 16) : ''}
            onChange={e => setForm({ ...form, rappel: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Récurrence</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-green-800 dark:border-green-700 dark:text-white"
            placeholder="Ex: chaque lundi"
            value={String(form.recurrence ?? '')}
            onChange={e => setForm({ ...form, recurrence: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Priorité</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-green-800 dark:border-green-700 dark:text-white"
            value={form.priorite}
            onChange={e => setForm({ ...form, priorite: e.target.value })}
          >
            <option value="haute">Haute</option>
            <option value="moyenne">Moyenne</option>
            <option value="basse">Basse</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Couleur</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-green-800 dark:border-green-700 dark:text-white"
            value={form.couleur}
            onChange={e => setForm({ ...form, couleur: e.target.value })}
          >
            <option value="bleu">Bleu</option>
            <option value="rouge">Rouge</option>
            <option value="vert">Vert</option>
            <option value="jaune">Jaune</option>
          </select>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
            checked={form.accompli}
            onChange={e => setForm({ ...form, accompli: e.target.checked })}
          />
          <label className="text-sm text-gray-700 dark:text-gray-200">Accompli</label>
        </div>
      </div>

      {/* Bouton submit */}
      <div className="col-span-full pt-4">
        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {loading ? "Enregistrement..." : "Enregistrer l'événement"}
        </button>
      </div>
    </form>
  );
}

interface AgendaEventResource {
  couleur?: string;
  description?: string;
  date_debut?: string;
  date_fin?: string;
  lieu?: string;
  participants?: string;
  priorite?: string;
  accompli?: boolean;
  utilisateur?: number;
  titre?: string;
  toute_la_journee?: boolean;
  rappel?: string | null;
  recurrence?: string | null;
  [key: string]: unknown;
}

interface AgendaEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: AgendaEventResource;
}

interface SlotInfo {
  start: Date;
  end: Date;
  slots?: Date[];
  action?: string;
}

interface ApiEvent {
  id: number;
  titre: string;
  date_debut: string;
  date_fin: string;
  toute_la_journee: boolean;
  couleur?: string;
  description?: string;
  lieu?: string;
  participants?: string;
  priorite?: string;
  accompli?: boolean;
  utilisateur?: number;
  [key: string]: unknown;
}

export default function AgendaCalendar({ token }: { token: string }) {
  // Ajout d'un état de chargement
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Modification de fetchEvents pour gérer le loading et éviter le warning
  const fetchEvents = useCallback(() => {
    setIsLoading(true);
    fetch(`${BASE_URL}/agenda/evenements/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    })
      .then((res: Response) => res.json())
      .then((data: ApiEvent[]) => {
        setEvents(
          data.map((ev: ApiEvent): AgendaEvent => ({
            id: ev.id,
            title: ev.titre,
            start: parseISO(ev.date_debut),
            end: parseISO(ev.date_fin),
            allDay: ev.toute_la_journee,
            resource: {
              ...ev,
              couleur: couleurToHex(ev.couleur ?? ''),
            },
          }))
        );
      })
      .finally(() => setIsLoading(false));
  }, [token]); // Ajoutez token comme dépendance

  // Ajout d'un useEffect pour le chargement initial
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Ajout d'un événement
  const handleAdd = async (data: AgendaEventResource) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/agenda/evenements/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          date_debut: data.date_debut ? new Date(data.date_debut).toISOString() : null,
          date_fin: data.date_fin ? new Date(data.date_fin).toISOString() : null,
          rappel: data.rappel ? new Date(data.rappel).toISOString() : null,
          recurrence: data.recurrence || "",
          utilisateur: typeof data.utilisateur === 'number' ? data.utilisateur : 1
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        alert(`Erreur lors de l'ajout: ${response.status}\n${errorText}`);
        return;
      }
      setShowAddModal(false);
      setLoading(false);
      fetchEvents();
    } catch (error) {
      alert(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
    }
  };

  // Modification d'un événement
  const handleEdit = async (data: AgendaEventResource) => {
    if (!selectedEvent) return;
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/agenda/evenements/${selectedEvent.id}/`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          date_debut: data.date_debut ? new Date(data.date_debut).toISOString() : null,
          date_fin: data.date_fin ? new Date(data.date_fin).toISOString() : null,
          rappel: data.rappel ? new Date(data.rappel).toISOString() : null,
          recurrence: data.recurrence || "",
          utilisateur: typeof data.utilisateur === 'number' ? data.utilisateur : 1
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        alert(`Erreur lors de la modification: ${response.status}\n${errorText}`);
        return;
      }
      setShowEditModal(false);
      setShowDetailModal(false);
      setLoading(false);
      fetchEvents();
    } catch (error) {
      alert(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
    }
  };

  // Suppression d'un événement
  const handleDelete = async (eventId: number) => {
    if (!window.confirm("Confirmer la suppression de cet événement ?")) return;
    await fetch(`${BASE_URL}/agenda/evenements/${eventId}/`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    setShowDetailModal(false);
    fetchEvents();
  };

  // Affichage des détails dans une modale
  const handleSelectEvent = (event: AgendaEvent) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  // Ajout d'un événement depuis un slot sélectionné
  const handleSelectSlot = (slot: SlotInfo) => {
    setSelectedDay(slot.start);
    setShowDayModal(true);
  };

  // Récupère les événements de la journée sélectionnée
  const eventsOfSelectedDay = selectedDay
    ? events.filter(ev =>
        ev.start.toDateString() === selectedDay.toDateString()
      )
    : [];

  // Handler pour ajouter un événement depuis la modale de journée
  const handleAddFromDay = () => {
    if (selectedDay) {
      setSlotInfo({ start: selectedDay, end: selectedDay });
      setShowAddModal(true);
    }
    setShowDayModal(false);
  };

  // Handler pour modifier un événement depuis la modale de journée
  const handleEditFromDay = (event: AgendaEvent) => {
    setSelectedEvent(event);
    setShowEditModal(true);
    setShowDayModal(false);
  };

  // Handler pour supprimer un événement depuis la modale de journée
  const handleDeleteFromDay = async (eventId: number) => {
    await handleDelete(eventId);
    setShowDayModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-green-950 py-8 px-4">
      {isLoading ? (
        <div className="max-w-6xl mx-auto flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Chargement du calendrier...
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          {/* Le reste du code existant reste inchangé */}
          <div className="flex items-center justify-between mb-8">
            <button
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              onClick={() => setShowAddModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nouvel événement
            </button>
          </div>

          {/* Modale Détail */}
          <Modal open={showDetailModal} onClose={() => setShowDetailModal(false)}>
            {selectedEvent && (
              <div>
                <h2 className="text-xl font-bold mb-2 text-emerald-700 dark:text-green-200">{selectedEvent.title}</h2>
                <div className="mb-2 text-gray-700 dark:text-gray-200">{selectedEvent.resource.description}</div>
                <div className="mb-2">
                  <span className="font-semibold">Début :</span>{" "}
                  {selectedEvent.resource.date_debut
                    ? format(parseISO(selectedEvent.resource.date_debut), "Pp", { locale: fr })
                    : "Non défini"}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Fin :</span>{" "}
                  {selectedEvent.resource.date_fin
                    ? format(parseISO(selectedEvent.resource.date_fin), "Pp", { locale: fr })
                    : "Non défini"}
                </div>
                <div className="mb-2"><span className="font-semibold">Lieu :</span> {selectedEvent.resource.lieu}</div>
                <div className="mb-2"><span className="font-semibold">Participants :</span> {selectedEvent.resource.participants}</div>
                <div className="mb-2"><span className="font-semibold">Priorité :</span> {selectedEvent.resource.priorite}</div>
                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white px-4 py-1 rounded-lg font-semibold shadow transition"
                    onClick={() => handleDelete(selectedEvent.id)}
                  >
                    Supprimer
                  </button>
                  <button
                    className="bg-green-100 hover:bg-green-200 text-emerald-700 px-4 py-1 rounded-lg font-semibold shadow transition"
                    onClick={() => setShowEditModal(true)}
                  >
                    Modifier
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* Modale Ajout */}
          <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setSlotInfo(null); }}>
            <h2 className="text-xl font-bold mb-4 text-emerald-700 dark:text-green-200">Ajouter un événement</h2>
            <EventForm
              onSubmit={handleAdd}
              loading={loading}
              initial={slotInfo ? {
                ...slotInfo,
                titre: '',
                description: '',
                date_debut: slotInfo.start ? format(slotInfo.start, "yyyy-MM-dd'T'HH:mm") : '',
                date_fin: slotInfo.end ? format(slotInfo.end, "yyyy-MM-dd'T'HH:mm") : '',
                toute_la_journee: slotInfo.action === 'doubleClick' ? false : slotInfo.slots?.length === 1,
                rappel: '',
                recurrence: '',
                priorite: 'moyenne',
                couleur: 'vert',
                lieu: '',
                participants: '',
                accompli: false,
                utilisateur: 1,
              } : undefined}
            />
          </Modal>

          {/* Modale Edition */}
          <Modal open={showEditModal} onClose={() => setShowEditModal(false)}>
            <h2 className="text-xl font-bold mb-4 text-emerald-700 dark:text-green-200">Modifier l&apos;événement</h2>
            {selectedEvent && (
              <EventForm
                initial={{
                  ...selectedEvent.resource,
                  date_debut: selectedEvent.resource.date_debut?.slice(0, 16),
                  date_fin: selectedEvent.resource.date_fin?.slice(0, 16),
                }}
                onSubmit={handleEdit}
                loading={loading}
              />
            )}
          </Modal>

          {/* Modale contextuelle pour la journée */}
          <Modal open={showDayModal} onClose={() => setShowDayModal(false)}>
            <h2 className="text-lg font-bold mb-4 text-emerald-700 dark:text-green-200">
              {selectedDay && format(selectedDay, "PPP", { locale: fr })}
            </h2>
            {eventsOfSelectedDay.length === 0 ? (
              <div className="flex flex-col items-center gap-4">
                <span>Aucun événement ce jour.</span>
                <button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition"
                  onClick={handleAddFromDay}
                >
                  + Ajouter un événement
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {eventsOfSelectedDay.map(ev => (
                  <div key={ev.id} className="border-b pb-2 mb-2">
                    <div className="font-semibold text-emerald-700 dark:text-green-200">{ev.title}</div>
                    <div className="text-xs text-gray-500 mb-1">
                      {format(ev.start, "p", { locale: fr })} - {format(ev.end, "p", { locale: fr })}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-green-100 hover:bg-green-200 text-emerald-700 px-3 py-1 rounded shadow"
                        onClick={() => handleEditFromDay(ev)}
                      >
                        Modifier
                      </button>
                      <button
                        className="bg-red-100 hover:bg-red-300 text-red-700 px-3 py-1 rounded shadow"
                        onClick={() => handleDeleteFromDay(ev.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-semibold shadow transition"
                  onClick={handleAddFromDay}
                >
                  + Ajouter un événement
                </button>
              </div>
            )}
          </Modal>

          <div className="bg-white dark:bg-green-900 rounded-xl shadow-sm border border-gray-200 dark:border-green-800 overflow-hidden">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              selectable
              onSelectSlot={handleSelectSlot}
              style={{ height: 700 }}
              eventPropGetter={event => ({
                style: {
                  backgroundColor: event.resource.couleur || '#059669',
                  borderRadius: '6px',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.875rem',
                  padding: '2px 8px',
                }
              })}
              messages={{
                date: 'Date',
                time: 'Heure',
                event: 'Événement',
                allDay: 'Toute la journée',
                week: 'Semaine',
                work_week: 'Semaine de travail',
                day: 'Jour',
                month: 'Mois',
                previous: 'Précédent',
                next: 'Suivant',
                yesterday: 'Hier',
                tomorrow: 'Demain',
                today: "Aujourd'hui",
                agenda: 'Agenda',
                noEventsInRange: 'Aucun événement dans cette période.',
                showMore: total => `+ ${total} plus`,
              }}
              views={['month', 'week', 'day', 'agenda']}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              popup
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .rbc-header {
          background: #f8fafc;
          color: #0f172a;
          font-weight: 500;
          padding: 12px;
          border-bottom: 2px solid #e2e8f0;
        }
        .rbc-day-bg + .rbc-day-bg,
        .rbc-month-row + .rbc-month-row {
          border-color: #f1f5f9;
        }
        .rbc-event {
          transition: transform 0.1s ease, box-shadow 0.2s ease;
        }
        .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
        }
        .rbc-toolbar {
          padding: 16px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
        }
        .rbc-toolbar button {
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .rbc-toolbar button:hover {
          background: #f1f5f9;
        }
      `}</style>
    </div>
  );
}