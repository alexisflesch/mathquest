import React from "react";

interface TeacherDashboardLayoutProps {
    header: React.ReactNode;
    controls: React.ReactNode;
    questionsList: React.ReactNode;
    statsPanel?: React.ReactNode;
    snackbar?: React.ReactNode;
    modals?: React.ReactNode;
}

/**
 * TeacherDashboardLayout
 *
 * Extracted layout for the teacher dashboard page. All content is passed as props.
 * No logic or state is included here.
 */
export default function TeacherDashboardLayout({
    header,
    controls,
    questionsList,
    statsPanel,
    snackbar,
    modals,
}: TeacherDashboardLayoutProps) {
    return (
        <div className="dashboard-main-content">
            <div className="dashboard-header">{header}</div>
            <div className="dashboard-controls">{controls}</div>
            <div className="dashboard-questions-list">{questionsList}</div>
            {statsPanel && <div className="dashboard-stats-panel">{statsPanel}</div>}
            {snackbar && <div className="dashboard-snackbar">{snackbar}</div>}
            {modals && <div className="dashboard-modals">{modals}</div>}
        </div>
    );
}
