import type { ComponentType } from 'react';
import { ChromeImportSection } from './sections/ChromeImportSection';
import { LanguageSection } from './sections/LanguageSection';
import { RealtimeSyncSection } from './sections/RealtimeSyncSection';
import { ThemeSection } from './sections/ThemeSection';
import { ViewModeSection } from './sections/ViewModeSection';

export interface SettingsSection {
	id: string;
	enabled: boolean;
	labelKey: string;
	descriptionKey: string;
	component: ComponentType;
}

/**
 * Settings section registry
 *
 * Adding a new section: 1) Create a standalone component in sections/  2) Add an entry below
 * Enable/disable a section: change the enabled value only
 */
export const SETTINGS_SECTIONS: SettingsSection[] = [
	{
		id: 'view-mode',
		enabled: true,
		labelKey: 'settings.sections.viewMode.label',
		descriptionKey: 'settings.sections.viewMode.description',
		component: ViewModeSection,
	},
	{
		id: 'theme',
		enabled: true,
		labelKey: 'settings.sections.theme.label',
		descriptionKey: 'settings.sections.theme.description',
		component: ThemeSection,
	},
	{
		id: 'realtime-sync',
		enabled: true,
		labelKey: 'settings.sections.realtimeSync.label',
		descriptionKey: 'settings.sections.realtimeSync.description',
		component: RealtimeSyncSection,
	},
	{
		id: 'chrome-import',
		enabled: true,
		labelKey: 'settings.sections.chromeImport.label',
		descriptionKey: 'settings.sections.chromeImport.description',
		component: ChromeImportSection,
	},
	{
		id: 'language',
		enabled: true,
		labelKey: 'settings.sections.language.label',
		descriptionKey: 'settings.sections.language.description',
		component: LanguageSection,
	},
];
