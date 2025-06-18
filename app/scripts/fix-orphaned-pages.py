#!/usr/bin/env python3
"""
Orphaned Pages Analyzer and Auto-Fixer
Analyzes navigation accessibility and provides automated fixes for orphaned pages.
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Set


class OrphanedPagesFixer:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.frontend_dir = self.project_root / "frontend" / "src"
        self.app_dir = self.frontend_dir / "app"
        self.pages_dir = self.frontend_dir / "pages"
        
        print(f"🔧 Starting Orphaned Pages Fixer...")
        print(f"📁 Project root: {self.project_root}")
        print(f"📁 Frontend dir: {self.frontend_dir}")
        
    def analyze_orphaned_pages(self) -> Dict[str, List[str]]:
        """Analyze which pages are orphaned and categorize them."""
        # From the navigation analyzer report, we know these are orphaned:
        orphaned_pages = [
            "/countdown-test",
            "/debug",
            "/debug/simple-timer", 
            "/debug/timer",
            "/debug-auth",
            "/debug-cookies",
            "/loading",
            "/login",
            "/my-tournaments",
            "/profile",
            "/socket-test",
            "/student/create-game",
            "/student/join",
            "/student/practice/session",
            "/teacher/games",
            "/teacher/games/new",
            "/teacher/quiz/create",
            "/teacher/quiz/use",
            "/teacher/reset-password"
        ]
        
        # Categorize pages
        categories = {
            "debug_pages": [],
            "auth_pages": [],
            "student_pages": [],
            "teacher_pages": [],
            "utility_pages": [],
            "test_pages": []
        }
        
        for page in orphaned_pages:
            if "debug" in page or "test" in page:
                if "test" in page:
                    categories["test_pages"].append(page)
                else:
                    categories["debug_pages"].append(page)
            elif page in ["/login", "/debug-auth", "/teacher/reset-password"]:
                categories["auth_pages"].append(page)
            elif page.startswith("/student"):
                categories["student_pages"].append(page)
            elif page.startswith("/teacher"):
                categories["teacher_pages"].append(page)
            else:
                categories["utility_pages"].append(page)
        
        return categories
    
    def create_navigation_components(self):
        """Create navigation components to link orphaned pages."""
        nav_components_dir = self.frontend_dir / "components" / "navigation"
        nav_components_dir.mkdir(parents=True, exist_ok=True)
        
        # Create main navigation component
        main_nav_content = '''import Link from 'next/link'
import { useRouter } from 'next/router'

interface NavLink {
  href: string
  label: string
  description?: string
}

const studentLinks: NavLink[] = [
  { href: '/student/join', label: 'Join Game', description: 'Join an existing game session' },
  { href: '/student/create-game', label: 'Create Game', description: 'Start a new game session' },
  { href: '/student/practice/session', label: 'Practice', description: 'Practice questions' },
]

const teacherLinks: NavLink[] = [
  { href: '/teacher/games', label: 'Manage Games', description: 'View and manage game sessions' },
  { href: '/teacher/games/new', label: 'New Game', description: 'Create a new game session' },
  { href: '/teacher/quiz/create', label: 'Create Quiz', description: 'Build new quiz content' },
  { href: '/teacher/quiz/use', label: 'Use Quiz', description: 'Deploy existing quiz' },
]

const utilityLinks: NavLink[] = [
  { href: '/profile', label: 'Profile', description: 'User profile and settings' },
  { href: '/my-tournaments', label: 'My Tournaments', description: 'View tournament history' },
]

export default function MainNavigation() {
  const router = useRouter()
  
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              MathQuest
            </Link>
            
            {/* Student Navigation */}
            <div className="hidden md:flex space-x-4">
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Student
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    {studentLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        title={link.description}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Teacher Navigation */}
            <div className="hidden md:flex space-x-4">
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Teacher
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    {teacherLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        title={link.description}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {utilityLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                title={link.description}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}'''
        
        with open(nav_components_dir / "MainNavigation.tsx", "w") as f:
            f.write(main_nav_content)
        
        print(f"✅ Created navigation component: {nav_components_dir / 'MainNavigation.tsx'}")
    
    def create_debug_menu(self):
        """Create a debug menu for development-only pages."""
        debug_menu_content = '''import Link from 'next/link'
import { useState } from 'react'

const debugLinks = [
  { href: '/debug', label: 'Debug Dashboard', description: 'General debugging tools' },
  { href: '/debug/simple-timer', label: 'Simple Timer', description: 'Test timer functionality' },
  { href: '/debug/timer', label: 'Advanced Timer', description: 'Advanced timer testing' },
  { href: '/debug-auth', label: 'Auth Debug', description: 'Authentication debugging' },
  { href: '/debug-cookies', label: 'Cookie Debug', description: 'Cookie management testing' },
  { href: '/socket-test', label: 'Socket Test', description: 'WebSocket connection testing' },
  { href: '/countdown-test', label: 'Countdown Test', description: 'Countdown timer testing' },
  { href: '/loading', label: 'Loading States', description: 'Test loading components' },
]

export default function DebugMenu() {
  const [isOpen, setIsOpen] = useState(false)
  
  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        title="Debug Menu"
      >
        🔧
      </button>
      
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-3 bg-red-50 border-b border-red-200">
            <h3 className="text-sm font-semibold text-red-800">Debug Menu</h3>
            <p className="text-xs text-red-600">Development only</p>
          </div>
          <div className="p-2">
            {debugLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                title={link.description}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}'''
        
        debug_components_dir = self.frontend_dir / "components" / "debug"
        debug_components_dir.mkdir(parents=True, exist_ok=True)
        
        with open(debug_components_dir / "DebugMenu.tsx", "w") as f:
            f.write(debug_menu_content)
        
        print(f"✅ Created debug menu component: {debug_components_dir / 'DebugMenu.tsx'}")
    
    def update_layout_component(self):
        """Update the main layout to include navigation."""
        layout_path = self.frontend_dir / "components" / "Layout.tsx"
        
        if not layout_path.exists():
            # Create a basic layout if it doesn't exist
            layout_content = '''import { ReactNode } from 'react'
import MainNavigation from './navigation/MainNavigation'
import DebugMenu from './debug/DebugMenu'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <DebugMenu />
    </div>
  )
}'''
            
            with open(layout_path, "w") as f:
                f.write(layout_content)
            
            print(f"✅ Created layout component: {layout_path}")
        else:
            print(f"ℹ️  Layout component already exists: {layout_path}")
    
    def create_homepage_links(self):
        """Update homepage to include links to major sections."""
        homepage_content = '''import Link from 'next/link'
import Layout from '../components/Layout'

const quickActions = [
  {
    title: 'Student Portal',
    description: 'Join games, practice, and compete',
    links: [
      { href: '/student/join', label: 'Join Game' },
      { href: '/student/practice/session', label: 'Practice Mode' },
      { href: '/student/create-game', label: 'Create Game' },
    ]
  },
  {
    title: 'Teacher Portal',
    description: 'Manage games, create quizzes, and monitor progress',
    links: [
      { href: '/teacher/games', label: 'Manage Games' },
      { href: '/teacher/quiz/create', label: 'Create Quiz' },
      { href: '/teacher/games/new', label: 'Start New Game' },
    ]
  },
  {
    title: 'User Account',
    description: 'Profile, tournaments, and settings',
    links: [
      { href: '/profile', label: 'My Profile' },
      { href: '/my-tournaments', label: 'Tournament History' },
      { href: '/login', label: 'Login / Register' },
    ]
  }
]

export default function HomePage() {
  return (
    <Layout>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Welcome to <span className="text-blue-600">MathQuest</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Interactive math learning through engaging games and competitions
        </p>
      </div>

      <div className="mt-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {quickActions.map((section) => (
            <div key={section.title} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {section.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {section.description}
              </p>
              <div className="space-y-2">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block w-full text-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 text-center">
        <div className="bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Get Started
          </h2>
          <p className="text-gray-600 mb-6">
            Choose your role to access the appropriate tools and features
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/student/join"
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              I'm a Student
            </Link>
            <Link
              href="/teacher/games"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              I'm a Teacher
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}'''
        
        # Check if we have app router or pages router
        if self.app_dir.exists():
            homepage_path = self.app_dir / "page.tsx"
        else:
            homepage_path = self.pages_dir / "index.tsx"
            
        homepage_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(homepage_path, "w") as f:
            f.write(homepage_content)
        
        print(f"✅ Created/updated homepage: {homepage_path}")
    
    def run_fixes(self):
        """Execute all automated fixes for orphaned pages."""
        print("\n🔍 Analyzing orphaned pages...")
        categories = self.analyze_orphaned_pages()
        
        for category, pages in categories.items():
            if pages:
                print(f"   📂 {category}: {len(pages)} pages")
                for page in pages:
                    print(f"      - {page}")
        
        print(f"\n🔧 Applying automated fixes...")
        
        # Create navigation components
        self.create_navigation_components()
        
        # Create debug menu for development pages
        self.create_debug_menu()
        
        # Update layout to include navigation
        self.update_layout_component()
        
        # Create comprehensive homepage
        self.create_homepage_links()
        
        print(f"\n✅ Orphaned pages fixes completed!")
        print(f"📋 Next steps:")
        print(f"   1. Review generated navigation components")
        print(f"   2. Test navigation in development mode")
        print(f"   3. Run navigation analyzer again to verify fixes")
        print(f"   4. Consider removing unused debug/test pages in production")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python fix-orphaned-pages.py <project_root>")
        sys.exit(1)
    
    project_root = sys.argv[1]
    fixer = OrphanedPagesFixer(project_root)
    fixer.run_fixes()
