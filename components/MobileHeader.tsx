import React from 'react';

const LogoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#14b8a6"/>
        <path d="M14 2V8H20" fill="#0d9488"/>
        <path d="M16 13H8V11H16V13Z" fill="white"/>
        <path d="M16 17H8V15H16V17Z" fill="white"/>
    </svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
    return (
        <header className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-stone-200">
            <div className="flex items-center justify-between h-16 px-4">
                <div className="flex items-center space-x-2">
                    <LogoIcon />
                    <span className="text-xl font-bold text-zinc-800 whitespace-nowrap">Factuurlijk</span>
                </div>
                <button onClick={onMenuClick} aria-label="Open menu" className="p-2 -mr-2 text-zinc-700">
                    <MenuIcon />
                </button>
            </div>
        </header>
    );
};
