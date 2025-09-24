"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { makeApiRequest } from '@/config/api';
import { ChevronDown, ChevronUp, ChevronRight, Plus, Rocket, Edit2, Copy, Trash2, Clock, BookOpen, Users, Target, Zap, Dumbbell, MoreHorizontal, X, Share2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Snackbar from '@/components/Snackbar';
import ConfirmationModal from '@/components/ConfirmationModal';
import InfoModal from '@/components/SharedModal';
import InfinitySpin from '@/components/InfinitySpin';
import InlineEdit from '@/components/ui/InlineEdit';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import StartActivityModal from '@/components/StartActivityModal';
import { GameTemplate, GameInstance } from '@shared/types/core/game';

// Interface for game template from backend
// Using shared GameTemplate type instead

// Response interface for fetching game templates
interface GameTemplatesResponse {
  gameTemplates: GameTemplate[];
}

// Interface for game instance
// Using shared GameInstance type instead

// ActivityCard Component
interface ActivityCardProps {
  template: GameTemplate;
  expanded: boolean;
  onToggle: () => void;
  onStartActivity: (templateId: string, mode: 'quiz' | 'tournament' | 'practice', name: string) => Promise<{ gameId: string; gameCode?: string; mode: 'quiz' | 'tournament' | 'practice' }>;
  onDuplicate: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  onDeleteInstance: (instanceId: string, instanceName: string) => void;
  onRenameTemplate: (templateId: string, newName: string) => Promise<void>;
  onRenameInstance: (instanceId: string, newName: string) => Promise<void>;
  formatDate: (dateString: string, opts?: { dateOnly?: boolean }) => string;
  gameInstances: GameInstance[];
  onFetchGameInstances: (templateId: string) => Promise<void>;
}

function ActivityCard({ template, expanded, onToggle, onStartActivity, onDuplicate, onDelete, onDeleteInstance, onRenameTemplate, onRenameInstance, formatDate, gameInstances, onFetchGameInstances }: ActivityCardProps) {
  // Robustly convert Date|string to ISO string to avoid runtime errors
  const toIso = (d: unknown): string => {
    if (!d) return '';
    if (typeof d === 'string') return d;
    try {
      return (d as Date).toISOString();
    } catch {
      return String(d);
    }
  };
  const [startModal, setStartModal] = useState<{
    isOpen: boolean;
    templateId: string | null;
    templateName: string;
  }>({ isOpen: false, templateId: null, templateName: '' });
  const [loadingInstances, setLoadingInstances] = useState(false);

  const openStartModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStartModal({ isOpen: true, templateId: template.id, templateName: template.name });
  };

  // Fetch game instances when expanded
  React.useEffect(() => {
    if (expanded && gameInstances.length === 0) {
      setLoadingInstances(true);
      onFetchGameInstances(template.id).finally(() => setLoadingInstances(false));
    }
  }, [expanded, template.id, gameInstances.length, onFetchGameInstances]);

  const handleStartActivity = async (mode: 'quiz' | 'tournament' | 'practice', name: string) => {
    const result = await onStartActivity(template.id, mode, name);
    // Don't close modal here - let the modal handle the transition
    return result;
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'quiz': return <Target size={16} />;
      case 'tournament': return <Users size={16} />;
      case 'practice': return <Dumbbell size={16} />;
      default: return <Rocket size={16} />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'quiz': return 'bg-[color:var(--muted)] text-[color:var(--primary)] border-[color:var(--border)]';
      case 'tournament': return 'bg-[color:var(--muted)] text-[color:var(--accent)] border-[color:var(--border)]';
      case 'practice': return 'bg-[color:var(--muted)] text-[color:var(--success)] border-[color:var(--border)]';
      default: return 'bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border-[color:var(--border)]';
    }
  };

  // For icon backgrounds: returns only the CSS variable value
  const getModeBgColor = (mode: string) => {
    switch (mode) {
      case 'quiz': return 'var(--primary)';
      case 'tournament': return 'var(--secondary)';
      case 'practice': return 'var(--success)';
      default: return 'var(--muted)';
    }
  };

  return (
    <>
      <div className="bg-[color:var(--card)] border border-[color:var(--border)] hover:border-[color:var(--muted-foreground)] transition-colors rounded-lg overflow-hidden">
        {/* Card Header - Always Visible */}
        <div
          className="p-3 sm:p-4 cursor-pointer"
          onClick={onToggle}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <InlineEdit
                  value={template.name}
                  onSave={(newName) => onRenameTemplate(template.id, newName)}
                  className="text-lg font-semibold text-[color:var(--foreground)]"
                  placeholder="Template name..."
                />
                {template.defaultMode && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getModeColor(template.defaultMode)}`}>
                    {getModeIcon(template.defaultMode)}
                    {template.defaultMode === 'quiz' ? 'Quiz' :
                      template.defaultMode === 'tournament' ? 'Tournoi' :
                        template.defaultMode === 'practice' ? 'Pratique' :
                          template.defaultMode}
                  </span>
                )}
                {/* Themes removed for cleaner UI */}
              </div>

              <div className="text-sm text-[color:var(--muted-foreground)]">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    <span className="hidden sm:inline">{formatDate(toIso(template.createdAt))}</span>
                    <span className="inline sm:hidden">{formatDate(toIso(template.createdAt), { dateOnly: true })}</span>
                  </span>
                  {template.questions && (
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {template.questions.length} question{template.questions.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-4">
              <button
                onClick={openStartModal}
                className="p-2 text-[color:var(--primary)] hover:bg-[color:var(--primary)] hover:bg-opacity-10 rounded transition-colors group"
                title="Lancer l'activité"
              >
                <Rocket size={16} className="transition-colors group-hover:stroke-white" />
              </button>
              {/* Temporarily disabled - Under construction */}
              {/* 
                            <span title="🛠️ En chantier !">
                                <button
                                    disabled
                                    className="p-2 text-[color:var(--muted-foreground)] rounded transition-colors opacity-60 cursor-not-allowed"
                                >
                                    <Edit2 size={16} />
                                </button>
                            </span>
                            <span title="🛠️ En chantier !">
                                <button
                                    disabled
                                    className="p-2 text-[color:var(--muted-foreground)] rounded transition-colors opacity-60 cursor-not-allowed"
                                >
                                    <Copy size={16} />
                                </button>
                            </span>
                            */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(template.id);
                }}
                className="p-2 text-[color:var(--alert)] hover:bg-[color:var(--alert)] hover:bg-opacity-10 rounded transition-colors group"
                title="Supprimer l'activité"
              >
                <Trash2 size={16} className="transition-colors group-hover:stroke-white" />
              </button>
              <button
                className="p-2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                title={expanded ? "Réduire" : "Développer"}
              >
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Content with Framer Motion */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="border-t border-[color:var(--border)] bg-[color:var(--muted)] rounded-b-lg overflow-hidden"
            >
              <div className="p-3 sm:p-4">
                {template.description && (
                  <div className="mb-3">
                    <p className="text-sm text-[color:var(--muted-foreground)]">{template.description}</p>
                  </div>
                )}

                {/* Game Instances Section */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[color:var(--foreground)] mb-2">
                    {`Session${gameInstances.length === 1 ? '' : 's'}`}
                    {!loadingInstances && (
                      <span className="ml-2 text-xs text-[color:var(--muted-foreground)] font-normal">
                        ({gameInstances.length})
                      </span>
                    )}
                  </h4>
                  {loadingInstances ? (
                    <div className="flex items-center gap-3 text-sm text-[color:var(--muted-foreground)]">
                      <InfinitySpin size={20} />
                      Chargement des sessions...
                    </div>
                  ) : gameInstances.length > 0 ? (
                    <div className="space-y-2">
                      {gameInstances.map((instance) => {
                        // Tournament: show "Terminé" only if differedAvailableTo is in the past, else "disponible" and show date range
                        let statusLabel = '';
                        let subtext = '';
                        const now = new Date();
                        const differedFrom = instance.differedAvailableFrom ? new Date(instance.differedAvailableFrom) : null;
                        const differedTo = instance.differedAvailableTo ? new Date(instance.differedAvailableTo) : null;

                        if (instance.playMode === 'practice') {
                          statusLabel = 'Disponible';
                          subtext = instance.accessCode ? ` ${instance.accessCode}` : '';
                        } else if (instance.playMode === 'tournament') {
                          if (differedTo && differedTo < now) {
                            statusLabel = 'Terminé';
                            subtext = instance.accessCode ? `${instance.accessCode}` : '';
                          } else {
                            statusLabel = 'Disponible';
                            if (differedFrom && differedTo) {
                              const format = (d: Date) => d.toLocaleDateString('fr-FR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                              subtext = `${instance.accessCode ? `${instance.accessCode} • ` : ''}${format(differedFrom)} → ${format(differedTo)}`;
                            } else {
                              subtext = instance.accessCode ? `${instance.accessCode}` : '';
                            }
                          }
                        } else {
                          // Quiz
                          statusLabel = instance.status === 'pending' ? 'En attente' :
                            instance.status === 'active' ? 'Actif' :
                              instance.status === 'completed' ? '' : 'Annulée';
                          subtext = instance.accessCode ? `${instance.accessCode}` : '';
                          if (subtext && instance.createdAt) {
                            subtext += ` • ${formatDate(toIso(instance.createdAt))}`;
                          } else if (instance.createdAt) {
                            subtext = formatDate(toIso(instance.createdAt));
                          }
                        }

                        return (
                          <div
                            key={instance.id}
                            className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span
                                  className="p-1 rounded inline-flex items-center justify-center"
                                  style={{ background: getModeBgColor(instance.playMode) }}
                                >
                                  {instance.playMode === 'quiz' && (
                                    <Target size={16} stroke="currentColor" style={{ color: 'white' }} />
                                  )}
                                  {instance.playMode === 'tournament' && (
                                    <Users size={16} stroke="currentColor" style={{ color: 'white' }} />
                                  )}
                                  {instance.playMode === 'practice' && (
                                    <Dumbbell size={16} stroke="currentColor" style={{ color: 'white' }} />
                                  )}
                                </span>
                                <div>
                                  <div className="text-sm font-medium text-[color:var(--foreground)] flex items-center gap-2">
                                    <span>
                                      {instance.playMode === 'quiz' ? 'Quiz' :
                                        instance.playMode === 'tournament' ? 'Tournoi' : 'Entraînement'}
                                    </span>
                                    {instance.name && (
                                      <>
                                        <span>-</span>
                                        <InlineEdit
                                          value={instance.name}
                                          onSave={(newName) => onRenameInstance(instance.id, newName)}
                                          className="text-sm font-medium"
                                          placeholder="Game name..."
                                        />
                                      </>
                                    )}
                                    {!instance.name && (
                                      <InlineEdit
                                        value=""
                                        onSave={(newName) => onRenameInstance(instance.id, newName)}
                                        className="text-sm font-medium text-[color:var(--muted-foreground)]"
                                        placeholder="Add name..."
                                      />
                                    )}
                                  </div>
                                  <div className="text-xs text-[color:var(--muted-foreground)]">
                                    {subtext}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Status label: only for tournament, not for quiz when completed */}
                                {instance.playMode === 'tournament' && (
                                  <span
                                    className={`px-2 py-1 text-xs ${statusLabel === 'Disponible' ? 'bg-[color:var(--success)] text-[color:var(--card)]' :
                                      statusLabel === 'Terminé' ? 'bg-[color:var(--primary)] text-[color:var(--card)]' :
                                        statusLabel === 'En attente' ? 'bg-[color:var(--muted)] text-[color:var(--muted-foreground)]' :
                                          statusLabel === 'Active' ? 'bg-[color:var(--success)] text-[color:var(--card)]' :
                                            'bg-[color:var(--alert)] text-[color:var(--card)]'
                                      }`}
                                    style={{ borderRadius: 'var(--radius)' }}
                                  >
                                    {statusLabel}
                                  </span>
                                )}
                                {/* For quiz: do not show label if completed */}
                                {instance.playMode === 'quiz' && instance.status !== 'completed' && (
                                  <span
                                    className={`px-2 py-1 text-xs ${statusLabel === 'Disponible' ? 'bg-[color:var(--success)] text-[color:var(--card)]' :
                                      statusLabel === 'En attente' ? 'bg-[color:var(--muted)] text-[color:var(--muted-foreground)]' :
                                        statusLabel === 'Active' ? 'bg-[color:var(--success)] text-[color:var(--card)]' :
                                          'bg-[color:var(--alert)] text-[color:var(--card)]'
                                      }`}
                                    style={{ borderRadius: 'var(--radius)' }}
                                  >
                                    {statusLabel}
                                  </span>
                                )}
                                {/* Tournament: keep button as is. Quiz: fix results link */}
                                {instance.playMode === 'quiz' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (instance.status === 'completed') {
                                        window.location.href = `/leaderboard/${instance.accessCode}`;
                                      } else {
                                        window.location.href = `/teacher/dashboard/${instance.accessCode}`;
                                      }
                                    }}
                                    className="text-xs px-2 py-1 bg-[color:var(--success)] text-[color:var(--success-foreground)] rounded hover:bg-opacity-90 transition-colors"
                                  >
                                    {instance.status === 'active' || instance.status === 'pending' ? 'Piloter' :
                                      instance.status === 'completed' ? 'Résultats' : 'Voir détails'}
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteInstance(instance.id, `${instance.playMode === 'quiz' ? 'Quiz' : instance.playMode === 'tournament' ? 'Tournoi' : 'Entraînement'} - ${formatDate(toIso(instance.createdAt))}`);
                                  }}
                                  className="p-1 text-[color:var(--alert)] hover:bg-[color:var(--alert)] hover:bg-opacity-10 rounded transition-colors group"
                                  title="Supprimer cette session"
                                >
                                  <Trash2 size={14} className="transition-colors group-hover:stroke-white" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[color:var(--muted-foreground)]">
                      Aucune session active pour cette activité.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Start Activity Modal */}
      {startModal.isOpen && (
        <StartActivityModal
          isOpen={startModal.isOpen}
          templateName={startModal.templateName}
          onClose={() => setStartModal({ isOpen: false, templateId: null, templateName: '' })}
          onStart={handleStartActivity}
        />
      )}
    </>
  );
}

export default function TeacherGamesPage() {
  // Access is now enforced by middleware; no need for useAccessGuard

  const [games, setGames] = useState<GameTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGameIds, setExpandedGameIds] = useState<Set<string>>(new Set());
  const [gameInstances, setGameInstances] = useState<Record<string, GameInstance[]>>({});
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    templateId: string | null;
    templateName: string;
    isLoading: boolean;
    forceDelete?: boolean;
  }>({ isOpen: false, templateId: null, templateName: '', isLoading: false });

  const [deleteInstanceModal, setDeleteInstanceModal] = useState<{
    isOpen: boolean;
    instanceId: string | null;
    instanceName: string;
    isLoading: boolean;
  }>({ isOpen: false, instanceId: null, instanceName: '', isLoading: false });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    defaultMode: 'success' | 'error';
  }>({ open: false, message: '', defaultMode: 'success' });
  const { teacherId, userState, isTeacher } = useAuth();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if user is authenticated as a teacher (use same logic as game creation)
      if (userState !== 'teacher' && !isTeacher) {
        setError('Impossible de trouver votre identifiant enseignant. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      console.log('Fetching game templates for teacher...');
      const response = await makeApiRequest<GameTemplatesResponse>(
        // Modernization: Use canonical Next.js API route
        '/api/game-templates'
      );

      console.log('Game templates response:', response);
      setGames(response.gameTemplates);
    } catch (err: unknown) {
      setError((err as Error).message || 'Erreur lors du chargement de vos activités.');
    } finally {
      setLoading(false);
    }
  }, [userState, isTeacher]);

  const toggleGameExpansion = useCallback((gameId: string) => {
    setExpandedGameIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  }, []);

  const formatDate = useCallback((dateString: string, opts?: { dateOnly?: boolean }) => {
    const date = new Date(dateString);
    if (opts && opts.dateOnly) {
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);
  const renameTemplate = useCallback(async (templateId: string, newName: string) => {
    try {
      const response = await fetch(
        `/api/game-templates/${templateId}/name`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rename template');
      }

      // Update the local state
      setGames(prevGames =>
        prevGames.map(game =>
          game.id === templateId
            ? { ...game, name: newName }
            : game
        )
      );

      setSnackbar({ open: true, message: 'Nom de l\'activité modifié', defaultMode: 'success' });
    } catch (error) {
      console.error('Error renaming template:', error);
      setSnackbar({
        open: true,
        message: (error as Error).message || 'Failed to rename template',
        defaultMode: 'error'
      });
      throw error;
    }
  }, []);

  const renameInstance = useCallback(async (instanceId: string, newName: string) => {
    try {
      const response = await fetch(
        `/api/games/instance/${instanceId}/name`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rename instance');
      }

      // Update the local state
      setGameInstances(prevInstances => {
        const newInstances = { ...prevInstances };
        Object.keys(newInstances).forEach(templateId => {
          newInstances[templateId] = newInstances[templateId].map(instance =>
            instance.id === instanceId
              ? { ...instance, name: newName }
              : instance
          );
        });
        return newInstances;
      });

      setSnackbar({ open: true, message: 'Nom de la session modifié', defaultMode: 'success' });
    } catch (error) {
      console.error('Error renaming instance:', error);
      setSnackbar({
        open: true,
        message: (error as Error).message || 'Failed to rename game',
        defaultMode: 'error'
      });
      throw error;
    }
  }, []);

  const fetchGameInstances = useCallback(async (templateId: string) => {
    try {
      const response = await makeApiRequest<{ gameInstances: GameInstance[] }>(
        // Modernization: Use canonical Next.js API route
        `/api/game-templates/${templateId}/instances`
      );

      setGameInstances(prev => ({
        ...prev,
        [templateId]: response.gameInstances
      }));
    } catch (err: unknown) {
      console.error('Error fetching game instances:', err);
      // Set empty array on error to avoid infinite loading
      setGameInstances(prev => ({
        ...prev,
        [templateId]: []
      }));
    }
  }, []);

  const startActivity = useCallback(async (templateId: string, playMode: 'quiz' | 'tournament' | 'practice', name: string) => {
    try {
      // Find the template to get its name
      const template = games.find(g => g.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Use provided name, fallback to template name if blank
      const finalName = name && name.trim() ? name.trim() : template.name;

      // Create a game instance from the template
      // Modernization: Always set status to 'completed' for tournaments created from teacher flow
      const gameData: any = {
        name: finalName, // Use the required name field
        gameTemplateId: templateId,
        playMode: playMode,
        settings: {}
      };
      if (playMode === 'tournament') {
        gameData.status = 'completed';
      }

      // Modernization: Use canonical Next.js API route
      const response = await makeApiRequest<{ gameInstance: { id: string, accessCode?: string } }>('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });

      // Refresh the game instances for this template
      await fetchGameInstances(templateId);

      // Return the game info for the modal
      return {
        gameId: response.gameInstance.id,
        gameCode: response.gameInstance.accessCode, // Map accessCode to gameCode for compatibility
        mode: playMode
      };
    } catch (err: unknown) {
      throw new Error(`Erreur lors du démarrage de l'activité: ${(err as Error).message}`);
    }
  }, [games, fetchGameInstances]);

  const duplicateTemplate = useCallback(async (templateId: string) => {
    try {
      // Get the original template details first
      const originalTemplate = games.find(g => g.id === templateId);
      if (!originalTemplate) return;

      // Create a duplicate template
      const duplicateData = {
        name: `${originalTemplate.name} (Copie)`,
        gradeLevel: originalTemplate.gradeLevel,
        themes: originalTemplate.themes,
        discipline: originalTemplate.discipline,
        description: originalTemplate.description,
        defaultMode: originalTemplate.defaultMode,
        questions: originalTemplate.questions
      };

      await makeApiRequest('game-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData)
      });

      // Refresh the templates list
      await fetchGames();
      alert('Modèle d\'activité dupliqué avec succès !');
    } catch (err: unknown) {
      alert(`Erreur lors de la duplication: ${(err as Error).message}`);
    }
  }, [games, fetchGames]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    // Find the template to get its name for the modal
    const template = games.find(g => g.id === templateId);
    if (!template) return;

    // Open the confirmation modal
    setDeleteModal({
      isOpen: true,
      templateId,
      templateName: template.name,
      isLoading: false
    });
  }, [games]);

  const handleConfirmDelete = async () => {
    if (!deleteModal.templateId) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      // Modernization: Use canonical Next.js API route
      const url = deleteModal.forceDelete
        ? `/api/game-templates/${deleteModal.templateId}?force=true`
        : `/api/game-templates/${deleteModal.templateId}`;

      // Modernization: Use canonical Next.js API route
      await makeApiRequest(url, {
        method: 'DELETE'
      });

      // Refresh the templates list
      await fetchGames();

      // Close modal and show success message
      setDeleteModal({ isOpen: false, templateId: null, templateName: '', isLoading: false });
      const successMessage = deleteModal.forceDelete
        ? 'Activité et toutes ses sessions supprimées avec succès !'
        : 'Activité supprimée avec succès !';
      setSnackbar({
        open: true,
        message: successMessage,
        defaultMode: 'success'
      });
    } catch (err: unknown) {
      const error = err as Error;
      setDeleteModal(prev => ({ ...prev, isLoading: false }));

      // If it's a 409 conflict error, offer force delete option
      if (error.message.includes('game session') && !deleteModal.forceDelete) {
        // Don't show error snackbar, just update modal to show force delete option
        setDeleteModal(prev => ({ ...prev, forceDelete: true }));
      } else {
        // Close modal and show error message
        const errorMessage = `Erreur lors de la suppression: ${error.message}`;
        setDeleteModal({ isOpen: false, templateId: null, templateName: '', isLoading: false });
        setSnackbar({
          open: true,
          message: errorMessage,
          defaultMode: 'error'
        });
      }
    }
  };

  const handleDeleteInstance = useCallback(async (instanceId: string, instanceName: string) => {
    setDeleteInstanceModal({
      isOpen: true,
      instanceId,
      instanceName,
      isLoading: false
    });
  }, []);

  const handleConfirmDeleteInstance = async () => {
    if (!deleteInstanceModal.instanceId) return;

    setDeleteInstanceModal(prev => ({ ...prev, isLoading: true }));

    try {
      // Modernization: Use canonical Next.js API route
      await makeApiRequest(`/api/games/${deleteInstanceModal.instanceId}`, {
        method: 'DELETE'
      });

      // Refresh game instances for all expanded templates
      const promises = Array.from(expandedGameIds).map(templateId =>
        fetchGameInstances(templateId)
      );
      await Promise.all(promises);

      // Close modal and show success message
      setDeleteInstanceModal({ isOpen: false, instanceId: null, instanceName: '', isLoading: false });
      setSnackbar({
        open: true,
        message: 'Session supprimée avec succès !',
        defaultMode: 'success'
      });
    } catch (err: unknown) {
      setDeleteInstanceModal(prev => ({ ...prev, isLoading: false }));
      setSnackbar({
        open: true,
        message: `Erreur lors de la suppression: ${(err as Error).message}`,
        defaultMode: 'error'
      });
    }
  };

  const handleCancelDelete = () => {
    if (!deleteModal.isLoading) {
      setDeleteModal({ isOpen: false, templateId: null, templateName: '', isLoading: false });
    }
  };

  const handleCancelDeleteInstance = () => {
    if (!deleteInstanceModal.isLoading) {
      setDeleteInstanceModal({ isOpen: false, instanceId: null, instanceName: '', isLoading: false });
    }
  };

  return (
    <div className="teacher-content">
      {/* Header */}
      <div className="bg-background border-b border-[color:var(--border)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mes Activités</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {games.length} activité{games.length !== 1 ? 's' : ''} créée{games.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="hidden sm:block">
              <Link href="/teacher/games/new" className="btn-primary flex items-center gap-2 whitespace-nowrap">
                <Plus size={20} />
                Créer une activité
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <InfinitySpin size={48} />
            <p className="text-muted-foreground mt-4">Chargement de vos activités...</p>
          </div>
        )}

        {error && (
          <div className="bg-[color:var(--alert)] bg-opacity-10 border border-[color:var(--alert)] border-opacity-30 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-[color:var(--alert)]">{error}</p>
              <button
                onClick={fetchGames}
                className="text-[color:var(--alert)] hover:text-[color:var(--alert)] hover:opacity-80 font-medium text-sm"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {!loading && !error && games.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-[color:var(--muted)] rounded-full flex items-center justify-center">
              <BookOpen size={40} className="text-[color:var(--muted-foreground)]" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Aucune activité créée</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Commencez par créer votre première activité pour engager vos élèves dans l&apos;apprentissage des mathématiques.
            </p>
          </div>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="grid gap-3 sm:gap-4">
            {games.map((template) => (
              <ActivityCard
                key={template.id}
                template={template}
                expanded={expandedGameIds.has(template.id)}
                onToggle={() => toggleGameExpansion(template.id)}
                onStartActivity={startActivity}
                onDuplicate={duplicateTemplate}
                onDelete={deleteTemplate}
                onDeleteInstance={handleDeleteInstance}
                onRenameTemplate={renameTemplate}
                onRenameInstance={renameInstance}
                formatDate={formatDate}
                gameInstances={gameInstances[template.id] || []}
                onFetchGameInstances={fetchGameInstances}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal - Positioned relative to content area */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          title="Supprimer l'activité"
          message={deleteModal.forceDelete
            ? `Il existe des sessions de jeu liées à &quot;${deleteModal.templateName}&quot;. Voulez-vous supprimer l&apos;activité ET toutes ses sessions ? Cette action est irréversible.`
            : `Êtes-vous sûr de vouloir supprimer &quot;${deleteModal.templateName}&quot; ? Cette action est irréversible.`
          }
          confirmText={deleteModal.forceDelete ? "Supprimer tout" : "Supprimer"}
          cancelText="Annuler"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          type="danger"
          isLoading={deleteModal.isLoading}
        />

        {/* Delete Instance Confirmation Modal - Positioned relative to content area */}
        <ConfirmationModal
          isOpen={deleteInstanceModal.isOpen}
          title="Supprimer la session de jeu"
          message={`Êtes-vous sûr de vouloir supprimer la session "${deleteInstanceModal.instanceName}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={handleConfirmDeleteInstance}
          onCancel={handleCancelDeleteInstance}
          type="danger"
          isLoading={deleteInstanceModal.isLoading}
        />
      </div>

      {/* Mobile FAB */}
      <div className="sm:hidden">
        <Link
          href="/teacher/games/new"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Plus size={24} />
        </Link>
      </div>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.defaultMode}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        duration={3000}
      />
    </div>
  );
}
