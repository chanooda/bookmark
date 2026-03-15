/**
 * Module-level guard that prevents the Chrome bookmark event listener
 * from treating our own sync operations as user-initiated changes.
 *
 * Keys:
 *   pendingCreates — `${title}|||${url}` for bookmarks, `folder|||${name}` for folders
 *   pendingRemoves — Chrome node ID
 *   pendingUpdates — Chrome node ID
 */
export const ChromeSyncGuard = {
	pendingCreates: new Set<string>(),
	pendingRemoves: new Set<string>(),
	pendingUpdates: new Set<string>(),
};
