import { createContext, useContext } from 'react';

interface SettingsDialogContextValue {
	setBlocking: (value: boolean) => void;
}

export const SettingsDialogContext = createContext<SettingsDialogContextValue>({
	setBlocking: () => {},
});

export function useSettingsDialogContext() {
	return useContext(SettingsDialogContext);
}
