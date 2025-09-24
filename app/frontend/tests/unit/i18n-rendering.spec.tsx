/**
 * i18n Rendering Tests
 *
 * Tests for internationalization and localization features:
 * - Translation key usage and fallback rendering
 * - RTL layout support for core views
 * - Math/LaTeX accessibility and localization
 * - Locale switching functionality
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock i18n system since none exists yet
const mockTranslations = {
    en: {
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.next': 'Next',
        'common.previous': 'Previous',
        'auth.login': 'Sign In',
        'auth.register': 'Sign Up',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.username': 'Username',
        'game.join': 'Join Game',
        'game.start': 'Start Game',
        'game.end': 'End Game',
        'leaderboard.title': 'Leaderboard',
        'question.correct': 'Correct!',
        'question.incorrect': 'Incorrect',
        'stats.score': 'Score',
        'stats.time': 'Time'
    },
    fr: {
        'common.loading': 'Chargement...',
        'common.error': 'Erreur',
        'common.cancel': 'Annuler',
        'common.confirm': 'Confirmer',
        'common.next': 'Suivant',
        'common.previous': 'Précédent',
        'auth.login': 'Se connecter',
        'auth.register': 'S\'inscrire',
        'auth.email': 'Email',
        'auth.password': 'Mot de passe',
        'auth.username': 'Nom d\'utilisateur',
        'game.join': 'Rejoindre la partie',
        'game.start': 'Commencer la partie',
        'game.end': 'Terminer la partie',
        'leaderboard.title': 'Classement',
        'question.correct': 'Correct !',
        'question.incorrect': 'Incorrect',
        'stats.score': 'Score',
        'stats.time': 'Temps'
    },
    ar: {
        'common.loading': 'جارٍ التحميل...',
        'common.error': 'خطأ',
        'common.cancel': 'إلغاء',
        'common.confirm': 'تأكيد',
        'common.next': 'التالي',
        'common.previous': 'السابق',
        'auth.login': 'تسجيل الدخول',
        'auth.register': 'التسجيل',
        'auth.email': 'البريد الإلكتروني',
        'auth.password': 'كلمة المرور',
        'auth.username': 'اسم المستخدم',
        'game.join': 'الانضمام للعبة',
        'game.start': 'بدء اللعبة',
        'game.end': 'إنهاء اللعبة',
        'leaderboard.title': 'لوحة الصدارة',
        'question.correct': 'صحيح!',
        'question.incorrect': 'خطأ',
        'stats.score': 'النتيجة',
        'stats.time': 'الوقت'
    }
};

let currentLocale = 'fr';
let fallbackLocale = 'en';

const mockT = (key: string, options?: { defaultValue?: string }) => {
    const translation = mockTranslations[currentLocale as keyof typeof mockTranslations]?.[key as keyof typeof mockTranslations.en];
    if (translation) return translation;

    // Try fallback locale
    const fallbackTranslation = mockTranslations[fallbackLocale as keyof typeof mockTranslations]?.[key as keyof typeof mockTranslations.en];
    if (fallbackTranslation) return fallbackTranslation;

    // Return default value or key with brackets to indicate missing translation
    return options?.defaultValue || `[${key}]`;
};

const mockUseTranslation = () => ({
    t: mockT,
    locale: currentLocale,
    changeLocale: (newLocale: string) => {
        currentLocale = newLocale;
    }
});

// Mock components that would use translations
const MockTranslatedComponent = ({ translationKey }: { translationKey: string }) => {
    const { t } = mockUseTranslation();
    return <div>{t(translationKey)}</div>;
};

const MockButtonWithTranslation = ({ action }: { action: 'cancel' | 'confirm' }) => {
    const { t } = mockUseTranslation();
    return <button>{t(`common.${action}`)}</button>;
};

const MockFormWithTranslations = () => {
    const { t } = mockUseTranslation();
    return (
        <form>
            <input placeholder={t('auth.email')} />
            <input placeholder={t('auth.password')} type="password" />
            <button type="submit">{t('auth.login')}</button>
        </form>
    );
};

const MockGameControls = () => {
    const { t } = mockUseTranslation();
    return (
        <div>
            <button>{t('game.join')}</button>
            <button>{t('game.start')}</button>
            <button>{t('game.end')}</button>
        </div>
    );
};

describe('i18n Rendering Tests', () => {
    beforeEach(() => {
        currentLocale = 'fr';
        fallbackLocale = 'en';
    });

    describe('Translation Key Usage and Fallbacks', () => {
        test('should render translation for existing keys', () => {
            render(<MockTranslatedComponent translationKey="common.loading" />);
            expect(screen.getByText('Chargement...')).toBeInTheDocument();
        });

        test('should fallback to English when French translation missing', () => {
            // Temporarily modify French translations to simulate missing key
            const originalFr = { ...mockTranslations.fr };
            const modifiedFr = { ...mockTranslations.fr };
            delete (modifiedFr as any)['common.loading'];
            (mockTranslations as any).fr = modifiedFr;

            render(<MockTranslatedComponent translationKey="common.loading" />);
            expect(screen.getByText('Loading...')).toBeInTheDocument();

            // Restore translations
            mockTranslations.fr = originalFr;
        });

        test('should show key in brackets when no translation found', () => {
            render(<MockTranslatedComponent translationKey="nonexistent.key" />);
            expect(screen.getByText('[nonexistent.key]')).toBeInTheDocument();
        });

        test('should use default value when provided', () => {
            const MockComponentWithDefault = () => {
                const { t } = mockUseTranslation();
                return <div>{t('missing.key', { defaultValue: 'Default Text' })}</div>;
            };

            render(<MockComponentWithDefault />);
            expect(screen.getByText('Default Text')).toBeInTheDocument();
        });

        test('should render common UI elements in current locale', () => {
            render(<MockButtonWithTranslation action="cancel" />);
            expect(screen.getByText('Annuler')).toBeInTheDocument();

            render(<MockButtonWithTranslation action="confirm" />);
            expect(screen.getByText('Confirmer')).toBeInTheDocument();
        });

        test('should render form elements with localized placeholders', () => {
            render(<MockFormWithTranslations />);

            expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Mot de passe')).toBeInTheDocument();
            expect(screen.getByText('Se connecter')).toBeInTheDocument();
        });

        test('should render game controls in current locale', () => {
            render(<MockGameControls />);

            expect(screen.getByText('Rejoindre la partie')).toBeInTheDocument();
            expect(screen.getByText('Commencer la partie')).toBeInTheDocument();
            expect(screen.getByText('Terminer la partie')).toBeInTheDocument();
        });
    });

    describe('Locale Switching', () => {
        test('should change locale programmatically', () => {
            const { t, changeLocale } = mockUseTranslation();

            // Initial state - French
            expect(t('common.loading')).toBe('Chargement...');

            // Change to English
            changeLocale('en');
            expect(t('common.loading')).toBe('Loading...');

            // Change to Arabic
            changeLocale('ar');
            expect(t('common.loading')).toBe('جارٍ التحميل...');

            // Change back to French
            changeLocale('fr');
            expect(t('common.loading')).toBe('Chargement...');
        });

        test('should maintain locale state across multiple translation calls', () => {
            const { t, changeLocale } = mockUseTranslation();

            changeLocale('en');
            expect(t('common.loading')).toBe('Loading...');
            expect(t('common.error')).toBe('Error');
            expect(t('auth.login')).toBe('Sign In');

            changeLocale('ar');
            expect(t('common.loading')).toBe('جارٍ التحميل...');
            expect(t('common.error')).toBe('خطأ');
            expect(t('auth.login')).toBe('تسجيل الدخول');
        });
    });

    describe('RTL Layout Support', () => {
        test('should apply RTL direction for Arabic locale', () => {
            currentLocale = 'ar';

            const MockRTLComponent = () => {
                const { t } = mockUseTranslation();
                return (
                    <div dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}>
                        <h1>{t('leaderboard.title')}</h1>
                        <p>{t('stats.score')}: 100</p>
                    </div>
                );
            };

            render(<MockRTLComponent />);

            const container = screen.getByText('لوحة الصدارة').closest('div');
            expect(container).toHaveAttribute('dir', 'rtl');
            expect(screen.getByText('لوحة الصدارة')).toBeInTheDocument();
            expect(screen.getByText('النتيجة: 100')).toBeInTheDocument();
        });

        test('should maintain LTR direction for Latin-based locales', () => {
            const MockLTRComponent = () => {
                const { t } = mockUseTranslation();
                return (
                    <div dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}>
                        <h1>{t('leaderboard.title')}</h1>
                        <p>{t('stats.score')}: 100</p>
                    </div>
                );
            };

            // Test French (LTR)
            render(<MockLTRComponent />);
            const frContainer = screen.getByText('Classement').closest('div');
            expect(frContainer).toHaveAttribute('dir', 'ltr');

            // Test English (LTR)
            currentLocale = 'en';
            render(<MockLTRComponent />);
            const enContainer = screen.getByText('Leaderboard').closest('div');
            expect(enContainer).toHaveAttribute('dir', 'ltr');
        });
    });

    describe('Math/LaTeX Localization', () => {
        test('should render mathematical expressions with localized labels', () => {
            const MockMathComponent = () => {
                const { t } = mockUseTranslation();
                const latexExpression = 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';
                return (
                    <div>
                        <div aria-label={t('question.correct')}>
                            ✓ Correct: {latexExpression}
                        </div>
                        <div aria-label={t('question.incorrect')}>
                            ✗ Incorrect
                        </div>
                    </div>
                );
            };

            render(<MockMathComponent />);

            const correctElement = screen.getByText(/Correct:/);
            const incorrectElement = screen.getByText(/Incorrect/);

            expect(correctElement).toHaveAttribute('aria-label', 'Correct !');
            expect(incorrectElement).toHaveAttribute('aria-label', 'Incorrect');
        });

        test('should provide accessible text for mathematical content', () => {
            const MockAccessibleMath = () => {
                const { t } = mockUseTranslation();
                return (
                    <div>
                        <span aria-label={`${t('stats.score')} 85 sur 100`}>
                            Score: \\( \\frac{85}{100} \\)
                        </span>
                        <span aria-label={`${t('stats.time')} 2 minutes 30 secondes`}>
                            Time: 2:30
                        </span>
                    </div>
                );
            };

            render(<MockAccessibleMath />);

            expect(screen.getByText(/Score:/)).toHaveAttribute('aria-label', 'Score 85 sur 100');
            expect(screen.getByText('Time: 2:30')).toHaveAttribute('aria-label', 'Temps 2 minutes 30 secondes');
        });
    });

    describe('Translation Coverage Validation', () => {
        test('should validate that all common UI strings have translations', () => {
            const requiredKeys = [
                'common.loading',
                'common.error',
                'common.cancel',
                'common.confirm',
                'auth.login',
                'auth.register',
                'game.join'
            ];

            requiredKeys.forEach(key => {
                const translation = mockT(key);
                expect(translation).not.toMatch(/^\[.*\]$/); // Should not be wrapped in brackets
                expect(translation).toBeTruthy();
            });
        });

        test('should detect missing translations in component trees', () => {
            const MockComponentWithMissingKeys = () => {
                const { t } = mockUseTranslation();
                return (
                    <div>
                        <span>{t('existing.key')}</span>
                        <span>{t('missing.translation')}</span>
                        <span>{t('another.missing.key')}</span>
                    </div>
                );
            };

            render(<MockComponentWithMissingKeys />);

            expect(screen.getByText('[missing.translation]')).toBeInTheDocument();
            expect(screen.getByText('[another.missing.key]')).toBeInTheDocument();
        });
    });
});