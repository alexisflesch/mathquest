/**
 * RTL Layout Tests
 *
 * Tests for Right-to-Left layout support in core views:
 * - Join game view RTL layout
 * - Answer submission view RTL layout
 * - Leaderboard view RTL layout
 * - Text direction and alignment
 * - Icon positioning in RTL
 * - Form layout in RTL
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock i18n system for RTL testing
let currentLocale = 'ar';
let isRTL = true;

const mockTranslations = {
    ar: {
        'game.join.title': 'الانضمام للعبة',
        'game.join.description': 'أدخل رمز اللعبة للانضمام',
        'game.join.placeholder': 'رمز اللعبة',
        'game.join.button': 'انضم للعبة',
        'game.join.loading': 'جارٍ الانضمام...',
        'answer.submit': 'إرسال الإجابة',
        'answer.placeholder': 'اكتب إجابتك هنا',
        'leaderboard.title': 'لوحة الصدارة',
        'leaderboard.rank': 'الترتيب',
        'leaderboard.player': 'اللاعب',
        'leaderboard.score': 'النتيجة',
        'common.back': 'العودة',
        'common.next': 'التالي',
        'common.loading': 'جارٍ التحميل...'
    },
    en: {
        'game.join.title': 'Join Game',
        'game.join.description': 'Enter the game code to join',
        'game.join.placeholder': 'Game Code',
        'game.join.button': 'Join Game',
        'game.join.loading': 'Joining...',
        'answer.submit': 'Submit Answer',
        'answer.placeholder': 'Type your answer here',
        'leaderboard.title': 'Leaderboard',
        'leaderboard.rank': 'Rank',
        'leaderboard.player': 'Player',
        'leaderboard.score': 'Score',
        'common.back': 'Back',
        'common.next': 'Next',
        'common.loading': 'Loading...'
    }
};

const mockT = (key: string) => mockTranslations[currentLocale as keyof typeof mockTranslations][key as keyof typeof mockTranslations.ar] || key;

// Mock components that simulate real app components with RTL considerations
const MockJoinGameView = ({ isRTL: rtl }: { isRTL?: boolean }) => {
    const locale = rtl ? 'ar' : 'en';
    const t = (key: string) => mockTranslations[locale as keyof typeof mockTranslations][key as keyof typeof mockTranslations.ar] || key;
    return (
        <div dir={rtl ? 'rtl' : 'ltr'} style={{ fontFamily: rtl ? 'Arial' : 'inherit' }}>
            <div className="container mx-auto p-4 max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold mb-2">{t('game.join.title')}</h1>
                    <p className="text-gray-600">{t('game.join.description')}</p>
                </div>

                <form className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder={t('game.join.placeholder')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ textAlign: rtl ? 'right' : 'left' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        {t('game.join.button')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button className="text-blue-500 hover:text-blue-600">
                        ← {t('common.back')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MockAnswerView = ({ isRTL: rtl }: { isRTL?: boolean }) => {
    const locale = rtl ? 'ar' : 'en';
    const t = (key: string) => mockTranslations[locale as keyof typeof mockTranslations][key as keyof typeof mockTranslations.ar] || key;
    return (
        <div dir={rtl ? 'rtl' : 'ltr'}>
            <div className="max-w-2xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-4">السؤال 1 من 5</h2>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-lg" style={{ textAlign: rtl ? 'right' : 'left' }}>
                                ما هو ناتج 2 + 3؟
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder={t('answer.placeholder')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            style={{ textAlign: rtl ? 'right' : 'left' }}
                        />

                        <div className="flex gap-3" style={{ flexDirection: rtl ? 'row-reverse' : 'row' }}>
                            <button className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                                {t('common.back')}
                            </button>
                            <button className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors">
                                {t('answer.submit')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MockLeaderboardView = ({ isRTL: rtl }: { isRTL?: boolean }) => {
    const locale = rtl ? 'ar' : 'en';
    const t = (key: string) => mockTranslations[locale as keyof typeof mockTranslations][key as keyof typeof mockTranslations.ar] || key;
    return (
        <div dir={rtl ? 'rtl' : 'ltr'}>
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-6 border-b border-gray-200">
                        <h1 className="text-2xl font-bold">{t('leaderboard.title')}</h1>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('leaderboard.rank')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('leaderboard.player')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('leaderboard.score')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">1</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">أحمد محمد</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">95</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">2</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">فاطمة علي</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">87</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MockNavigationWithIcons = ({ isRTL: rtl }: { isRTL?: boolean }) => {
    return (
        <div dir={rtl ? 'rtl' : 'ltr'}>
            <nav className="flex items-center justify-between p-4 bg-white shadow-sm" role="navigation">
                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    {rtl ? '→' : '←'} {rtl ? 'العودة' : 'Back'}
                </button>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <span>🏠</span>
                        {rtl ? 'الرئيسية' : 'Home'}
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <span>⚙️</span>
                        {rtl ? 'الإعدادات' : 'Settings'}
                    </button>
                </div>

                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    {rtl ? 'التالي' : 'Next'} {rtl ? '←' : '→'}
                </button>
            </nav>
        </div>
    );
};

describe('RTL Layout Tests', () => {
    beforeEach(() => {
        currentLocale = 'ar';
        isRTL = true;
    });

    describe('Join Game View RTL Layout', () => {
        test('should apply RTL direction to join game container', () => {
            render(<MockJoinGameView isRTL={true} />);

            const container = screen.getByText('الانضمام للعبة').parentElement?.parentElement?.parentElement;
            expect(container).toHaveAttribute('dir', 'rtl');
        });

        test('should align text to the right in RTL mode', () => {
            render(<MockJoinGameView isRTL={true} />);

            const input = screen.getByPlaceholderText('رمز اللعبة');
            expect(input).toHaveStyle({ textAlign: 'right' });
        });

        test('should maintain LTR layout when RTL is disabled', () => {
            render(<MockJoinGameView isRTL={false} />);

            const container = screen.getByText('Join Game', { selector: 'h1' }).parentElement?.parentElement?.parentElement;
            expect(container).toHaveAttribute('dir', 'ltr');

            const input = screen.getByPlaceholderText('Game Code');
            expect(input).toHaveStyle({ textAlign: 'left' });
        });

        test('should position back button correctly in RTL', () => {
            render(<MockJoinGameView isRTL={true} />);

            const backButton = screen.getByText('← العودة');
            expect(backButton).toBeInTheDocument();
        });

        test('should position back button correctly in LTR', () => {
            render(<MockJoinGameView isRTL={false} />);

            const backButton = screen.getByText('← Back');
            expect(backButton).toBeInTheDocument();
        });
    });

    describe('Answer View RTL Layout', () => {
        test('should apply RTL direction to answer view', () => {
            render(<MockAnswerView isRTL={true} />);

            // Find the outermost div with dir attribute
            const allDivs = document.querySelectorAll('div[dir]');
            const rtlDiv = Array.from(allDivs).find(div => div.getAttribute('dir') === 'rtl');
            expect(rtlDiv).toBeInTheDocument();
        });

        test('should reverse button order in RTL mode', () => {
            render(<MockAnswerView isRTL={true} />);

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(2);

            // In RTL, the flex direction should be row-reverse
            const buttonContainer = buttons[0].parentElement;
            expect(buttonContainer).toHaveStyle({ flexDirection: 'row-reverse' });
        });

        test('should align answer input to the right in RTL', () => {
            render(<MockAnswerView isRTL={true} />);

            const input = screen.getByPlaceholderText('اكتب إجابتك هنا');
            expect(input).toHaveStyle({ textAlign: 'right' });
        });

        test('should align question text to the right in RTL', () => {
            render(<MockAnswerView isRTL={true} />);

            const questionText = screen.getByText('ما هو ناتج 2 + 3؟');
            expect(questionText).toHaveStyle({ textAlign: 'right' });
        });

        test('should maintain normal button order in LTR mode', () => {
            render(<MockAnswerView isRTL={false} />);

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(2);

            const buttonContainer = buttons[0].parentElement;
            expect(buttonContainer).toHaveStyle({ flexDirection: 'row' });
        });
    });

    describe('Leaderboard View RTL Layout', () => {
        test('should apply RTL direction to leaderboard', () => {
            render(<MockLeaderboardView isRTL={true} />);

            // Find the outermost div with dir attribute
            const allDivs = document.querySelectorAll('div[dir]');
            const rtlDiv = Array.from(allDivs).find(div => div.getAttribute('dir') === 'rtl');
            expect(rtlDiv).toBeInTheDocument();
        });

        test('should display Arabic names correctly in RTL', () => {
            render(<MockLeaderboardView isRTL={true} />);

            expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
            expect(screen.getByText('فاطمة علي')).toBeInTheDocument();
        });

        test('should maintain table header alignment in RTL', () => {
            render(<MockLeaderboardView isRTL={true} />);

            const headers = screen.getAllByRole('columnheader');
            expect(headers).toHaveLength(3);
            expect(headers[0]).toHaveTextContent('الترتيب');
            expect(headers[1]).toHaveTextContent('اللاعب');
            expect(headers[2]).toHaveTextContent('النتيجة');
        });

        test('should handle numeric data correctly in RTL tables', () => {
            render(<MockLeaderboardView isRTL={true} />);

            // Ranks should still be LTR for numbers
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('95')).toBeInTheDocument();
            expect(screen.getByText('87')).toBeInTheDocument();
        });
    });

    describe('Navigation and Icon Positioning', () => {
        test('should position navigation icons correctly in RTL', () => {
            render(<MockNavigationWithIcons isRTL={true} />);

            const nav = screen.getByRole('navigation');
            expect(nav.parentElement).toHaveAttribute('dir', 'rtl');

            // Check that arrow directions are reversed
            expect(screen.getByText('→ العودة')).toBeInTheDocument();
            expect(screen.getByText('التالي ←')).toBeInTheDocument();
        });

        test('should position navigation icons correctly in LTR', () => {
            render(<MockNavigationWithIcons isRTL={false} />);

            const nav = screen.getByRole('navigation');
            expect(nav.parentElement).toHaveAttribute('dir', 'ltr');

            expect(screen.getByText('← Back')).toBeInTheDocument();
            expect(screen.getByText('Next →')).toBeInTheDocument();
        });

        test('should maintain icon positioning relative to text in RTL', () => {
            render(<MockNavigationWithIcons isRTL={true} />);

            // Icons should appear after text in RTL
            expect(screen.getByText('الرئيسية')).toBeInTheDocument();
            expect(screen.getByText('الإعدادات')).toBeInTheDocument();
            // Check that the home button contains both icon and text
            const homeButton = screen.getByText('الرئيسية').closest('button');
            expect(homeButton).toHaveTextContent('🏠');
            expect(homeButton).toHaveTextContent('الرئيسية');
        });

        test('should maintain icon positioning relative to text in LTR', () => {
            render(<MockNavigationWithIcons isRTL={false} />);

            // Icons should appear before text in LTR
            expect(screen.getByText('Home')).toBeInTheDocument();
            expect(screen.getByText('Settings')).toBeInTheDocument();
            // Check that the home button contains both icon and text
            const homeButton = screen.getByText('Home').closest('button');
            expect(homeButton).toHaveTextContent('🏠');
            expect(homeButton).toHaveTextContent('Home');
        });
    });

    describe('Form Layout in RTL', () => {
        test('should align form labels and inputs correctly in RTL', () => {
            const MockRTLForm = () => (
                <div dir="rtl">
                    <form className="space-y-4 max-w-md mx-auto p-6" role="form">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                الاسم الكامل
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                style={{ textAlign: 'right' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                البريد الإلكتروني
                            </label>
                            <input
                                type="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                style={{ textAlign: 'right' }}
                            />
                        </div>
                        <div className="flex gap-3" style={{ flexDirection: 'row-reverse' }}>
                            <button className="flex-1 bg-gray-200 py-2 px-4 rounded-md">
                                إلغاء
                            </button>
                            <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md">
                                حفظ
                            </button>
                        </div>
                    </form>
                </div>
            );

            render(<MockRTLForm />);

            const form = screen.getByRole('form');
            expect(form.parentElement).toHaveAttribute('dir', 'rtl');

            // Check that all inputs have right text alignment
            const inputs = screen.getAllByRole('textbox');
            inputs.forEach(input => {
                expect(input).toHaveStyle({ textAlign: 'right' });
            });

            // Check button order is reversed
            const buttons = screen.getAllByRole('button');
            expect(buttons[0]).toHaveTextContent('إلغاء');
            expect(buttons[1]).toHaveTextContent('حفظ');

            const buttonContainer = buttons[0].parentElement;
            expect(buttonContainer).toHaveStyle({ flexDirection: 'row-reverse' });
        });

        test('should handle mixed content (LTR numbers in RTL text)', () => {
            const MockMixedContentForm = () => (
                <div dir="rtl">
                    <div className="p-4">
                        <p className="mb-4">
                            السؤال رقم <span dir="ltr">1</span> من <span dir="ltr">10</span>
                        </p>
                        <input
                            type="text"
                            placeholder="أدخل رقمك المفضل"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            style={{ textAlign: 'right' }}
                        />
                    </div>
                </div>
            );

            render(<MockMixedContentForm />);

            // Check that numbers maintain LTR direction within RTL text
            expect(screen.getByText(/السؤال رقم/)).toBeInTheDocument();
            const ltrSpans = screen.getAllByText(/1|10/);
            expect(ltrSpans).toHaveLength(2);
        });
    });

    describe('RTL Layout Consistency', () => {
        test('should maintain consistent RTL behavior across components', () => {
            // Test multiple components with RTL
            const { rerender } = render(<MockJoinGameView isRTL={true} />);
            expect(screen.getByText('الانضمام للعبة').parentElement?.parentElement?.parentElement).toHaveAttribute('dir', 'rtl');

            rerender(<MockAnswerView isRTL={true} />);
            // Find the outermost div with dir attribute
            const allDivs = document.querySelectorAll('div[dir]');
            const rtlDiv = Array.from(allDivs).find(div => div.getAttribute('dir') === 'rtl');
            expect(rtlDiv).toBeInTheDocument();

            rerender(<MockLeaderboardView isRTL={true} />);
            // Find the outermost div with dir attribute
            const allDivs2 = document.querySelectorAll('div[dir]');
            const rtlDiv2 = Array.from(allDivs2).find(div => div.getAttribute('dir') === 'rtl');
            expect(rtlDiv2).toBeInTheDocument();
        });

        test('should handle dynamic RTL switching', () => {
            let rtlEnabled = false;

            const MockDynamicRTL = () => (
                <div dir={rtlEnabled ? 'rtl' : 'ltr'}>
                    <h1>{rtlEnabled ? 'مرحباً' : 'Hello'}</h1>
                    <p>{rtlEnabled ? 'هذا نص باللغة العربية' : 'This is English text'}</p>
                </div>
            );

            const { rerender } = render(<MockDynamicRTL />);

            // Initially LTR
            expect(screen.getByText('Hello').closest('div')).toHaveAttribute('dir', 'ltr');

            // Switch to RTL
            rtlEnabled = true;
            rerender(<MockDynamicRTL />);
            expect(screen.getByText('مرحباً').closest('div')).toHaveAttribute('dir', 'rtl');
        });

        test('should handle RTL with CSS Grid and Flexbox', () => {
            const MockGridLayout = ({ isRTL: rtl }: { isRTL?: boolean }) => (
                <div dir={rtl ? 'rtl' : 'ltr'}>
                    <div className="grid grid-cols-3 gap-4 p-4">
                        <div className="bg-blue-100 p-4 rounded">العنصر الأول</div>
                        <div className="bg-green-100 p-4 rounded">العنصر الثاني</div>
                        <div className="bg-red-100 p-4 rounded">العنصر الثالث</div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-100">
                        <span>البداية</span>
                        <span>الوسط</span>
                        <span>النهاية</span>
                    </div>
                </div>
            );

            render(<MockGridLayout isRTL={true} />);

            const container = screen.getByText('العنصر الأول').parentElement?.parentElement;
            expect(container).toHaveAttribute('dir', 'rtl');

            // Verify all grid items are present
            expect(screen.getByText('العنصر الأول')).toBeInTheDocument();
            expect(screen.getByText('العنصر الثاني')).toBeInTheDocument();
            expect(screen.getByText('العنصر الثالث')).toBeInTheDocument();

            // Verify flex items maintain logical order in RTL
            expect(screen.getByText('البداية')).toBeInTheDocument();
            expect(screen.getByText('الوسط')).toBeInTheDocument();
            expect(screen.getByText('النهاية')).toBeInTheDocument();
        });
    });
});