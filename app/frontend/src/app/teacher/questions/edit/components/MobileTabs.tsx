'use client';

import React from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface MobileTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export const MobileTabs: React.FC<MobileTabsProps> = ({
    tabs,
    activeTab,
    onTabChange,
}) => {
    return (
        // Mobile-only tabs: increase touch target and legibility on small screens
        <div className="md:hidden bg-card shadow-sm">
            <div className="flex border-b-2 border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        // Larger padding, bigger text, and improved spacing for mobile (<768px)
                        className={`flex-1 py-4 px-5 text-center text-base font-semibold transition-all leading-5 ${activeTab === tab.id
                            ? 'border-b-4 border-primary text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                    >
                        {tab.icon && <span className="inline-block mr-2 align-middle text-lg">{tab.icon}</span>}
                        <span className="align-middle">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};