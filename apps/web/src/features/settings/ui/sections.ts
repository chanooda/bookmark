import type { ComponentType } from 'react';
import { ChromeImportSection } from './sections/ChromeImportSection';
import { RealtimeSyncSection } from './sections/RealtimeSyncSection';
import { ThemeSection } from './sections/ThemeSection';
import { ViewModeSection } from './sections/ViewModeSection';

export interface SettingsSection {
	id: string;
	enabled: boolean;
	label: string;
	description: string;
	component: ComponentType;
}

/**
 * 설정 섹션 레지스트리
 *
 * 새 섹션 추가:  1) sections/ 에 자립형 컴포넌트 파일 생성  2) 아래 배열에 항목 추가
 * 섹션 끄기/켜기: enabled 값만 변경
 */
export const SETTINGS_SECTIONS: SettingsSection[] = [
	{
		id: 'view-mode',
		enabled: true,
		label: '보기 설정',
		description: '북마크 목록을 표시하는 레이아웃을 선택합니다.',
		component: ViewModeSection,
	},
	{
		id: 'theme',
		enabled: true,
		label: '테마',
		description: '앱의 색상 테마를 선택합니다.',
		component: ThemeSection,
	},
	{
		id: 'realtime-sync',
		enabled: true,
		label: '동기화',
		description: 'Chrome 북마크와의 실시간 동기화 방향을 설정합니다.',
		component: RealtimeSyncSection,
	},
	{
		id: 'chrome-import',
		enabled: true,
		label: 'Chrome 가져오기',
		description: 'Chrome 브라우저의 북마크를 앱으로 가져옵니다.',
		component: ChromeImportSection,
	},
];
