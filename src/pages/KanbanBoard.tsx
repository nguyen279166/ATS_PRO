import { useParams } from "react-router-dom";
import AddCandidateModal from "../components/AddCandidateModal";
import CandidateDrawer from "../features/kanban/CandidateDrawer";
import KanbanBoardGrid from "../features/kanban/KanbanBoardGrid";
import { KanbanJobNotFound, KanbanLoading } from "../features/kanban/KanbanStates";
import KanbanToolbar from "../features/kanban/KanbanToolbar";
import { useKanbanBoard } from "../features/kanban/useKanbanBoard";

export default function KanbanBoard() {
  const { jobId } = useParams();
  const board = useKanbanBoard(jobId);

  if (board.loading) return <KanbanLoading />;
  if (!board.currentJob) return <KanbanJobNotFound />;

  return (
    <div
      className='flex h-full max-w-[1600px] flex-col gap-5 sm:gap-6'
      aria-labelledby='kanban-page-title'
    >
      <KanbanToolbar
        jobTitle={board.currentJob.title}
        department={board.currentJob.department}
        location={board.currentJob.location}
        candidateCount={board.candidates.length}
        searchTerm={board.searchTerm}
        onSearchChange={board.setSearchTerm}
        onAddCandidate={() => board.setShowModal(true)}
      />

      <KanbanBoardGrid
        allCandidatesCount={board.candidates.length}
        candidates={board.visibleCandidates}
        searchTerm={board.searchTerm}
        updatingCandidateIds={board.updatingCandidateIds}
        onOpenCandidate={board.setSelectedCandidate}
        onStatusChange={board.handleStatusChange}
        onDrop={board.handleDrop}
        onDropOnCard={board.handleDropOnCard}
      />

      {board.showModal && jobId && (
        <AddCandidateModal
          jobId={jobId}
          onClose={() => board.setShowModal(false)}
          onAdd={board.handleAddCandidate}
        />
      )}

      {board.selectedCandidate && (
        <CandidateDrawer
          candidate={board.selectedCandidate}
          activeTab={board.activeTab}
          onTabChange={board.setActiveTab}
          onClose={board.closeCandidate}
          onCandidateChange={board.updateSelectedCandidate}
        />
      )}
    </div>
  );
}
