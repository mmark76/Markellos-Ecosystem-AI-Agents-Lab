'use strict';

const BUILD_TIME_ZONE = 'Europe/Nicosia';
const BUILD_ID_PATTERN = /^v[0-9]+\.[0-9]+\.[0-9]+_[0-9]{8}_[0-9]{4}_[0-9a-f]{7}$/;
const APPEARANCE_STORAGE_KEY = 'markellos.dashboard.appearance.v1';
const DEFAULT_APPEARANCE = Object.freeze({
  colorMode: 'light',
  accent: '#6f8499',
  background: null,
  font: 'system',
  textSize: '100',
  spacing: 'comfortable'
});

const ALLOWED_APPEARANCE = Object.freeze({
  colorMode: new Set(['light', 'dark']),
  font: new Set(['system', 'humanist', 'serif']),
  textSize: new Set(['100', '112.5', '125']),
  spacing: new Set(['compact', 'comfortable', 'spacious'])
});

const TRANSLATIONS = Object.freeze({
  en: Object.freeze({
    dashboardHome: 'Dashboard home',
    dashboardUtilities: 'Dashboard utilities',
    language: 'Language',
    greekLanguage: 'Greek',
    englishLanguage: 'English',
    primaryNavigation: 'Primary navigation',
    versionInformation: 'Version information',
    assistantName: 'Template Assistant',
    assistantStatus: 'Ready',
    assistantLabel: 'PROJECT ASSISTANT',
    assistantPlaceholder: 'Integrated template assistant. No external Assistant backend is connected.',
    settings: 'Settings',
    info: 'Info',
    navigation: 'Navigation',
    home: 'Home',
    overview: 'Overview',
    documents: 'Documents',
    about: 'About',
    appearance: 'APPEARANCE',
    accentColour: 'Accent colour',
    backgroundColour: 'Background colour',
    font: 'Font',
    fontSystem: 'System sans',
    fontHumanist: 'Humanist sans',
    fontSerif: 'Readable serif',
    textSize: 'Text size',
    textStandard: 'Standard',
    textLarge: 'Large',
    textLarger: 'Larger',
    spacing: 'Spacing',
    spacingCompact: 'Compact',
    spacingComfortable: 'Comfortable',
    spacingSpacious: 'Spacious',
    resetAppearance: 'Reset appearance',
    close: 'Close',
    closeAssistant: 'Close Template Assistant',
    closeSettings: 'Close Settings',
    closeInfo: 'Close Info',
    importantInfo: 'Important Info',
    feedback: 'Feedback',
    license: 'License',
    privacy: 'Privacy',
    analyticsChoices: 'Analytics choices',
    copyrightProtected: 'Copyright protected',
    importantDescription: 'This site is a project-starter reference for the Markellos Ecosystem foundations.',
    feedbackDescription: 'No public feedback channel is configured for this site.',
    licenseDescription: 'Refer to the approved project licensing documentation.',
    privacyDescription: 'Appearance preferences are stored locally on this device; no analytics service is configured.',
    analyticsDescription: 'No analytics service is configured for this template site.',
    copyrightDescription: 'Copyright applies to this template site and related project materials.',
    languageStatus: 'Shell controls support English and Greek. Template reference content remains English.',
    saved: 'Appearance preferences saved on this device.',
    notPersisted: 'Appearance changes applied for this session but could not be saved on this device.',
    reset: 'Appearance preferences reset.',
    resetNotPersisted: 'Appearance reset for this session, but the saved device preference could not be cleared.',
    themeDark: 'Dark',
    themeLight: 'Light',
    switchDark: 'Switch to dark theme',
    switchLight: 'Switch to light theme'
  }),
  el: Object.freeze({
    dashboardHome: 'Αρχική σελίδα dashboard',
    dashboardUtilities: 'Βοηθητικά στοιχεία dashboard',
    language: 'Γλώσσα',
    greekLanguage: 'Ελληνικά',
    englishLanguage: 'Αγγλικά',
    primaryNavigation: 'Κύρια πλοήγηση',
    versionInformation: 'Πληροφορίες έκδοσης',
    assistantName: 'Βοηθός Προτύπου',
    assistantStatus: 'Έτοιμος',
    assistantLabel: 'ΒΟΗΘΟΣ ΕΡΓΟΥ',
    assistantPlaceholder: 'Βοηθός του ολοκληρωμένου προτύπου. Δεν είναι συνδεδεμένο εξωτερικό backend Assistant.',
    settings: 'Ρυθμίσεις',
    info: 'Πληροφορίες',
    navigation: 'Πλοήγηση',
    home: 'Αρχική',
    overview: 'Επισκόπηση',
    documents: 'Έγγραφα',
    about: 'Σχετικά',
    appearance: 'ΕΜΦΑΝΙΣΗ',
    accentColour: 'Χρώμα έμφασης',
    backgroundColour: 'Χρώμα φόντου',
    font: 'Γραμματοσειρά',
    fontSystem: 'Γραμματοσειρά συστήματος',
    fontHumanist: 'Ανθρωπιστική sans',
    fontSerif: 'Ευανάγνωστη serif',
    textSize: 'Μέγεθος κειμένου',
    textStandard: 'Κανονικό',
    textLarge: 'Μεγάλο',
    textLarger: 'Μεγαλύτερο',
    spacing: 'Αποστάσεις',
    spacingCompact: 'Συμπαγείς',
    spacingComfortable: 'Άνετες',
    spacingSpacious: 'Ευρύχωρες',
    resetAppearance: 'Επαναφορά εμφάνισης',
    close: 'Κλείσιμο',
    closeAssistant: 'Κλείσιμο Βοηθού Προτύπου',
    closeSettings: 'Κλείσιμο Ρυθμίσεων',
    closeInfo: 'Κλείσιμο Πληροφοριών',
    importantInfo: 'Σημαντικές Πληροφορίες',
    feedback: 'Σχόλια',
    license: 'Άδεια',
    privacy: 'Απόρρητο',
    analyticsChoices: 'Επιλογές αναλυτικών',
    copyrightProtected: 'Προστασία πνευματικών δικαιωμάτων',
    importantDescription: 'Αυτός ο ιστότοπος είναι το δημόσιο σημείο αναφοράς για τη μεθοδολογία έργων και το λειτουργικό μοντέλο του Markellos Ecosystem.',
    feedbackDescription: 'Δεν έχει ρυθμιστεί δημόσιο κανάλι σχολίων για αυτόν τον ιστότοπο.',
    licenseDescription: 'Ανατρέξτε στην εγκεκριμένη τεκμηρίωση αδειοδότησης του έργου.',
    privacyDescription: 'Οι προτιμήσεις εμφάνισης αποθηκεύονται τοπικά σε αυτή τη συσκευή· δεν έχει ρυθμιστεί υπηρεσία αναλυτικών.',
    analyticsDescription: 'Δεν έχει ρυθμιστεί υπηρεσία αναλυτικών για τον ιστότοπο Framework.',
    copyrightDescription: 'Η προστασία πνευματικών δικαιωμάτων ισχύει για τον ιστότοπο Framework και το σχετικό υλικό έργων.',
    languageStatus: 'Τα στοιχεία του κελύφους υποστηρίζουν Ελληνικά και Αγγλικά. Το περιεχόμενο αναφοράς του Framework παραμένει στα Αγγλικά.',
    saved: 'Οι προτιμήσεις εμφάνισης αποθηκεύτηκαν σε αυτή τη συσκευή.',
    notPersisted: 'Οι αλλαγές εμφάνισης εφαρμόστηκαν για αυτή τη συνεδρία, αλλά δεν ήταν δυνατή η αποθήκευσή τους στη συσκευή.',
    reset: 'Έγινε επαναφορά των προτιμήσεων εμφάνισης.',
    resetNotPersisted: 'Η εμφάνιση επανήλθε για αυτή τη συνεδρία, αλλά δεν ήταν δυνατή η διαγραφή της αποθηκευμένης προτίμησης στη συσκευή.',
    themeDark: 'Σκούρο',
    themeLight: 'Φωτεινό',
    switchDark: 'Μετάβαση σε σκούρο θέμα',
    switchLight: 'Μετάβαση σε φωτεινό θέμα'
  })
});

function normalizeHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
}

function normalizeAppearance(candidate = {}) {
  const source = candidate && typeof candidate === 'object' ? candidate : {};
  return {
    colorMode: ALLOWED_APPEARANCE.colorMode.has(source.colorMode) ? source.colorMode : DEFAULT_APPEARANCE.colorMode,
    accent: normalizeHexColor(source.accent) ?? DEFAULT_APPEARANCE.accent,
    background: source.background === null ? null : normalizeHexColor(source.background),
    font: ALLOWED_APPEARANCE.font.has(source.font) ? source.font : DEFAULT_APPEARANCE.font,
    textSize: ALLOWED_APPEARANCE.textSize.has(String(source.textSize)) ? String(source.textSize) : DEFAULT_APPEARANCE.textSize,
    spacing: ALLOWED_APPEARANCE.spacing.has(source.spacing) ? source.spacing : DEFAULT_APPEARANCE.spacing
  };
}

function formatCyprusBuildTimestamp(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('A valid Date is required.');
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUILD_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    date: `${values.year}${values.month}${values.day}`,
    time: `${values.hour}${values.minute}`,
    timeZone: BUILD_TIME_ZONE
  };
}

function formatBuildId({ version, date, time, commit, timeZone = BUILD_TIME_ZONE } = {}) {
  const normalizedVersion = typeof version === 'string' && /^[0-9]+\.[0-9]+\.[0-9]+$/.test(version.trim())
    ? version.trim()
    : 'X.Y.Z';
  const normalizedDate = typeof date === 'string' ? date.replaceAll('-', '').trim() : '';
  const normalizedTime = typeof time === 'string' ? time.replace(':', '').trim() : '';
  const normalizedCommit = typeof commit === 'string' && /^[0-9a-f]{7,40}$/i.test(commit.trim())
    ? commit.trim().slice(0, 7).toLowerCase()
    : '';

  if (
    normalizedVersion !== 'X.Y.Z'
    && /^[0-9]{8}$/.test(normalizedDate)
    && /^[0-9]{4}$/.test(normalizedTime)
    && normalizedCommit
    && timeZone === BUILD_TIME_ZONE
  ) {
    return `v${normalizedVersion}_${normalizedDate}_${normalizedTime}_${normalizedCommit}`;
  }

  return `v${normalizedVersion}_YYYYMMDD_HHMM_SHA`;
}

function isDarkColor(hexColor) {
  const normalized = normalizeHexColor(hexColor);
  if (!normalized) return false;

  const channels = [1, 3, 5].map((index) => Number.parseInt(normalized.slice(index, index + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return luminance <= 0.179;
}

function loadAppearance(storage) {
  if (!storage) return { ...DEFAULT_APPEARANCE };

  try {
    const stored = storage.getItem(APPEARANCE_STORAGE_KEY);
    return stored ? normalizeAppearance(JSON.parse(stored)) : { ...DEFAULT_APPEARANCE };
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

function saveAppearance(storage, preferences) {
  if (!storage) return false;

  try {
    storage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(normalizeAppearance(preferences)));
    return true;
  } catch {
    return false;
  }
}

function getStorage(windowReference) {
  try {
    return windowReference.localStorage;
  } catch {
    return null;
  }
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function applyTranslations(documentReference, language, preferences) {
  const strings = TRANSLATIONS[language] ?? TRANSLATIONS.en;
  documentReference.documentElement.lang = language;
  documentReference.documentElement.dataset.language = language;

  documentReference.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (typeof strings[key] === 'string') setText(element, strings[key]);
  });

  documentReference.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (typeof strings[key] === 'string') element.setAttribute('aria-label', strings[key]);
  });

  documentReference.querySelectorAll('[data-language]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });

  setText(documentReference.getElementById('language-status'), strings.languageStatus);

  const themeButton = documentReference.getElementById('theme-toggle');
  const themeLabel = themeButton?.querySelector('[data-theme-toggle-label]');
  const darkActive = preferences.colorMode === 'dark';
  setText(themeLabel, darkActive ? strings.themeLight : strings.themeDark);
  themeButton?.setAttribute('aria-label', darkActive ? strings.switchLight : strings.switchDark);
}

function applyAppearance(documentReference, preferences) {
  const normalized = normalizeAppearance(preferences);
  const root = documentReference.documentElement;
  const effectiveBackground = normalized.background ?? (normalized.colorMode === 'dark' ? '#111827' : '#f8fafc');
  const backgroundIsDark = isDarkColor(effectiveBackground);
  const accentIsDark = isDarkColor(normalized.accent);

  root.dataset.colorMode = normalized.colorMode;
  root.dataset.font = normalized.font;
  root.dataset.textSize = normalized.textSize;
  root.dataset.spacing = normalized.spacing;
  root.dataset.backgroundTone = backgroundIsDark ? 'dark' : 'light';
  root.style.setProperty('--user-text-size', `${normalized.textSize}%`);
  root.style.setProperty('--user-accent', normalized.accent);
  root.style.setProperty('--user-accent-contrast', accentIsDark ? '#ffffff' : '#000000');
  root.style.setProperty('--user-background', effectiveBackground);
  root.style.setProperty('--page-text', backgroundIsDark ? '#ffffff' : '#000000');
  root.style.setProperty('--page-muted', backgroundIsDark ? '#ffffff' : '#000000');

  const themeButton = documentReference.getElementById('theme-toggle');
  themeButton?.setAttribute('aria-pressed', String(normalized.colorMode === 'dark'));

  const accentInput = documentReference.getElementById('accent-color');
  const backgroundInput = documentReference.getElementById('background-color');
  const fontInput = documentReference.getElementById('font-choice');
  const textSizeInput = documentReference.getElementById('text-size');
  const spacingInput = documentReference.getElementById('spacing-choice');

  if (accentInput) accentInput.value = normalized.accent;
  if (backgroundInput) backgroundInput.value = effectiveBackground;
  if (fontInput) fontInput.value = normalized.font;
  if (textSizeInput) textSizeInput.value = normalized.textSize;
  if (spacingInput) spacingInput.value = normalized.spacing;

  setText(documentReference.getElementById('accent-value'), normalized.accent.toUpperCase());
  setText(documentReference.getElementById('background-value'), effectiveBackground.toUpperCase());
  return normalized;
}

function readBuildMetadata(documentReference) {
  const readMeta = (name) => documentReference.querySelector(`meta[name="${name}"]`)?.content?.trim() ?? '';
  return {
    version: readMeta('build-version'),
    date: readMeta('build-date'),
    time: readMeta('build-time'),
    timeZone: readMeta('build-time-zone'),
    commit: readMeta('build-commit')
  };
}

function initializeDashboard(documentReference, windowReference) {
  const storage = getStorage(windowReference);
  let preferences = loadAppearance(storage);
  let language = 'en';
  preferences = applyAppearance(documentReference, preferences);
  applyTranslations(documentReference, language, preferences);

  const year = formatCyprusBuildTimestamp(new Date()).date.slice(0, 4);
  documentReference.querySelectorAll('#current-year, [data-current-year]').forEach((element) => setText(element, year));

  const buildId = formatBuildId(readBuildMetadata(documentReference));
  documentReference.querySelectorAll('[data-build-id]').forEach((element) => setText(element, buildId));
  documentReference.documentElement.dataset.buildIdStatus = BUILD_ID_PATTERN.test(buildId) ? 'populated' : 'template';

  const appearanceStatus = documentReference.getElementById('appearance-status');
  const updateAppearance = (patch) => {
    preferences = applyAppearance(documentReference, { ...preferences, ...patch });
    const persisted = saveAppearance(storage, preferences);
    applyTranslations(documentReference, language, preferences);
    setText(appearanceStatus, persisted ? TRANSLATIONS[language].saved : TRANSLATIONS[language].notPersisted);
  };

  documentReference.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => {
      language = button.dataset.language === 'el' ? 'el' : 'en';
      applyTranslations(documentReference, language, preferences);
    });
  });

  documentReference.getElementById('theme-toggle')?.addEventListener('click', () => {
    updateAppearance({ colorMode: preferences.colorMode === 'dark' ? 'light' : 'dark' });
  });

  documentReference.getElementById('accent-color')?.addEventListener('input', (event) => {
    updateAppearance({ accent: event.currentTarget.value });
  });

  documentReference.getElementById('background-color')?.addEventListener('input', (event) => {
    updateAppearance({ background: event.currentTarget.value });
  });

  documentReference.getElementById('font-choice')?.addEventListener('change', (event) => {
    updateAppearance({ font: event.currentTarget.value });
  });

  documentReference.getElementById('text-size')?.addEventListener('change', (event) => {
    updateAppearance({ textSize: event.currentTarget.value });
  });

  documentReference.getElementById('spacing-choice')?.addEventListener('change', (event) => {
    updateAppearance({ spacing: event.currentTarget.value });
  });

  documentReference.getElementById('reset-appearance')?.addEventListener('click', () => {
    let resetPersisted = false;
    if (storage) {
      try {
        storage.removeItem(APPEARANCE_STORAGE_KEY);
        resetPersisted = true;
      } catch {
        // The visual reset remains usable when browser storage is unavailable.
      }
    }
    preferences = applyAppearance(documentReference, DEFAULT_APPEARANCE);
    applyTranslations(documentReference, language, preferences);
    setText(appearanceStatus, resetPersisted ? TRANSLATIONS[language].reset : TRANSLATIONS[language].resetNotPersisted);
  });

  const connectDialog = (triggerId, dialogId) => {
    const trigger = documentReference.getElementById(triggerId);
    const dialog = documentReference.getElementById(dialogId);
    if (!trigger || !dialog) return;

    trigger.addEventListener('click', () => {
      dialog.showModal();
      dialog.querySelector('[data-close-dialog]')?.focus();
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => trigger.focus());
  };

  connectDialog('assistant-button', 'assistant-dialog');
  connectDialog('settings-button', 'settings-dialog');
  connectDialog('info-button', 'info-dialog');

  documentReference.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog')?.close());
  });

  const menuButton = documentReference.querySelector('.menu-button');
  const navigation = documentReference.getElementById('primary-navigation');
  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const isOpen = navigation.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });

    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        navigation.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  return Object.freeze({ buildId, preferences: { ...preferences }, language });
}

const DashboardShell = Object.freeze({
  APPEARANCE_STORAGE_KEY,
  BUILD_ID_PATTERN,
  BUILD_TIME_ZONE,
  DEFAULT_APPEARANCE,
  formatBuildId,
  formatCyprusBuildTimestamp,
  initializeDashboard,
  isDarkColor,
  loadAppearance,
  normalizeAppearance,
  normalizeHexColor,
  saveAppearance
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardShell;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.DashboardShell = DashboardShell;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeDashboard(document, window), { once: true });
  } else {
    initializeDashboard(document, window);
  }
}
