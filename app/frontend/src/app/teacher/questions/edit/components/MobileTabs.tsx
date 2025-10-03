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
        <div className="md:hidden">
            <div className="flex border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex-1 py-3 px-4 text-center text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'border-b-2 border-primary text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        {tab.icon && <span className="mr-2">{tab.icon}</span>}
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
};