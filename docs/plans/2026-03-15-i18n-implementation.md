# i18n Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply react-i18next to the web app to support English, Korean, Chinese, and Japanese with automatic browser language detection.

**Architecture:** Install react-i18next + i18next, create locale JSON files under `apps/web/src/locales/{en,ko,zh,ja}/translation.json`, initialize i18n in `shared/lib/i18n/`, wrap the app with `I18nProvider`, add a `LanguageSection` to the Settings dialog, and replace all hardcoded Korean strings across UI components with `t()` calls.

**Tech Stack:** react-i18next@latest, i18next@latest, i18next-browser-languagedetector@latest

---

## Task 1: Install packages

**Files:**

- Modify: `apps/web/package.json`

**Step 1: Install dependencies**

```bash
cd apps/web && pnpm add react-i18next i18next i18next-browser-languagedetector
```

**Step 2: Verify packages appear in package.json**

```bash
grep -E "i18next|react-i18next" apps/web/package.json
```

Expected: three entries visible.

**Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): install react-i18next and i18next"
```

---

## Task 2: Create locale JSON files

**Files:**

- Create: `apps/web/src/locales/en/translation.json`
- Create: `apps/web/src/locales/ko/translation.json`
- Create: `apps/web/src/locales/zh/translation.json`
- Create: `apps/web/src/locales/ja/translation.json`

**Step 1: Create `apps/web/src/locales/en/translation.json`**

```json
{
  "settings": {
    "title": "Settings",
    "description": "App settings and data management",
    "sections": {
      "viewMode": {
        "label": "View",
        "description": "Choose the layout for displaying the bookmark list."
      },
      "theme": {
        "label": "Theme",
        "description": "Choose the color theme for the app."
      },
      "realtimeSync": {
        "label": "Sync",
        "description": "Set the direction of real-time sync with Chrome bookmarks."
      },
      "chromeImport": {
        "label": "Chrome Import",
        "description": "Import bookmarks from Chrome browser into the app."
      },
      "language": {
        "label": "Language",
        "description": "Choose the display language for the app."
      }
    }
  },
  "theme": {
    "label": "Theme",
    "light": "Light",
    "dark": "Dark",
    "system": "System",
    "switchToLight": "Switch to light mode",
    "switchToDark": "Switch to dark mode"
  },
  "viewMode": {
    "label": "View Mode",
    "glass": "Glass",
    "grid": "Grid",
    "list": "List"
  },
  "sync": {
    "label": "Real-time Sync",
    "save": "Save",
    "warning": "⚠ Depending on sync settings, Chrome bookmarks may be deleted. We recommend exporting your Chrome bookmarks first (Chrome Settings → Bookmarks → Export bookmarks).",
    "warningPath": "Chrome Settings → Bookmarks → Export bookmarks",
    "options": {
      "off": {
        "label": "No Sync",
        "description": "Automatic sync between Chrome bookmarks and app is disabled."
      },
      "chromeToWeb": {
        "label": "Chrome → Web",
        "description": "Chrome bookmark changes are automatically reflected in the app.",
        "warning": "⚠ Bookmarks deleted in Chrome will also be permanently deleted in the app."
      },
      "webToChrome": {
        "label": "Web → Chrome",
        "description": "App bookmark changes are automatically reflected in Chrome bookmarks.",
        "warning": "⚠ Bookmarks deleted in the app will also be permanently deleted in Chrome."
      },
      "bidirectional": {
        "label": "Bidirectional",
        "description": "App and Chrome bookmarks sync automatically in both directions.",
        "warning": "⚠ Deleting from either side permanently deletes from both."
      }
    }
  },
  "chromeImport": {
    "title": "Import Chrome Bookmarks",
    "description": "Import bookmarks from your current Chrome browser into the app. Existing URLs will be skipped.",
    "progress": "{{current}} / {{total}} processing...",
    "done": "Done — {{current}} of {{total}} processed",
    "error": "Error: {{message}}",
    "unknownError": "Unknown error",
    "importing": "Importing... ({{percent}}%)",
    "reimport": "Re-import",
    "import": "Import Chrome Bookmarks"
  },
  "language": {
    "label": "Language",
    "languages": {
      "en": "English",
      "ko": "한국어",
      "zh": "中文",
      "ja": "日本語"
    }
  },
  "bookmark": {
    "add": "Add Bookmark",
    "edit": "Edit Bookmark",
    "adding": "Adding...",
    "editing": "Editing...",
    "url": "URL",
    "title": "Title",
    "titlePlaceholder": "Title",
    "description": "Description",
    "descriptionPlaceholder": "Description (optional)",
    "folder": "Folder",
    "tag": "Tag",
    "syncError": "Chrome bookmark sync failed."
  },
  "tag": {
    "add": "Add Tag",
    "edit": "Edit Tag",
    "name": "Name",
    "namePlaceholder": "Tag name",
    "color": "Color",
    "customColor": "Custom",
    "preview": "Preview",
    "adding": "Adding...",
    "saving": "Saving...",
    "delete": "Delete"
  },
  "folder": {
    "new": "New Folder",
    "rename": "Rename Folder",
    "name": "Name",
    "namePlaceholder": "Folder name",
    "createInside": "Will be created inside",
    "adding": "Adding...",
    "saving": "Saving...",
    "addChild": "Add subfolder",
    "rename_action": "Rename",
    "delete": "Delete",
    "deleteConfirm": "Delete this folder? Subfolders and bookmarks will also be deleted.",
    "syncError": "Chrome folder sync failed.",
    "deleteError": "Failed to delete folder.",
    "saveEnter": "Save (Enter)",
    "cancelEsc": "Cancel (Esc)",
    "collapse": "Collapse",
    "expand": "Expand"
  },
  "sidebar": {
    "folders": "Folders",
    "addFolder": "Add folder",
    "tags": "Tags",
    "addTag": "Add tag",
    "all": "All",
    "editTag": "Edit"
  },
  "header": {
    "addBookmark": "Add Bookmark",
    "settings": "Settings"
  },
  "bookmarkList": {
    "loadError": "An error occurred while loading bookmarks",
    "unknownError": "Unknown error",
    "empty": "No bookmarks",
    "reorderSyncError": "Chrome bookmark order sync failed.",
    "reorderError": "Failed to reorder bookmarks."
  },
  "filterBar": {
    "folders": "Folders",
    "tags": "Tags",
    "all": "All",
    "addFolder": "Add folder",
    "addTag": "Add tag"
  },
  "search": {
    "bookmarkLabel": "Bookmark",
    "bookmarkPlaceholder": "Search saved bookmarks...",
    "bookmarkAriaLabel": "Search bookmarks",
    "clearAriaLabel": "Clear search",
    "googleAriaLabel": "Search Google or enter URL",
    "googlePlaceholder": "Search or enter URL...",
    "googleHomeAriaLabel": "Go to Google homepage",
    "googleHomeTitle": "Go to google.com",
    "searchButton": "Search",
    "go": "Go"
  },
  "common": {
    "cancel": "Cancel",
    "save": "Save",
    "add": "Add",
    "edit": "Edit"
  }
}
```

**Step 2: Create `apps/web/src/locales/ko/translation.json`**

```json
{
  "settings": {
    "title": "설정",
    "description": "앱 설정 및 데이터 관리",
    "sections": {
      "viewMode": {
        "label": "보기 설정",
        "description": "북마크 목록을 표시하는 레이아웃을 선택합니다."
      },
      "theme": {
        "label": "테마",
        "description": "앱의 색상 테마를 선택합니다."
      },
      "realtimeSync": {
        "label": "동기화",
        "description": "Chrome 북마크와의 실시간 동기화 방향을 설정합니다."
      },
      "chromeImport": {
        "label": "Chrome 가져오기",
        "description": "Chrome 브라우저의 북마크를 앱으로 가져옵니다."
      },
      "language": {
        "label": "언어",
        "description": "앱의 표시 언어를 선택합니다."
      }
    }
  },
  "theme": {
    "label": "테마",
    "light": "라이트",
    "dark": "다크",
    "system": "시스템",
    "switchToLight": "라이트 모드로 전환",
    "switchToDark": "다크 모드로 전환"
  },
  "viewMode": {
    "label": "뷰 모드",
    "glass": "글래스",
    "grid": "그리드",
    "list": "목록"
  },
  "sync": {
    "label": "실시간 동기화",
    "save": "저장",
    "warning": "⚠ 동기화 설정에 따라 크롬 북마크가 삭제될 수 있습니다. 사전에 크롬 북마크를 내보내기({{path}})하는 것을 권장합니다.",
    "warningPath": "Chrome 설정 → 북마크 및 목록 → 북마크 내보내기",
    "options": {
      "off": {
        "label": "동기화 안 함",
        "description": "Chrome 북마크와 앱 간 자동 동기화를 사용하지 않습니다."
      },
      "chromeToWeb": {
        "label": "Chrome → Web",
        "description": "Chrome 북마크 변경 시 앱에 자동 반영됩니다.",
        "warning": "⚠ Chrome에서 북마크 삭제 시 앱에서도 영구 삭제됩니다."
      },
      "webToChrome": {
        "label": "Web → Chrome",
        "description": "앱에서 북마크 변경 시 Chrome 북마크에 자동 반영됩니다.",
        "warning": "⚠ 앱에서 북마크 삭제 시 Chrome에서도 영구 삭제됩니다."
      },
      "bidirectional": {
        "label": "양방향",
        "description": "앱과 Chrome 북마크가 양방향으로 자동 동기화됩니다.",
        "warning": "⚠ 어느 쪽에서 삭제해도 양쪽에서 영구 삭제됩니다."
      }
    }
  },
  "chromeImport": {
    "title": "Chrome 북마크 가져오기",
    "description": "현재 Chrome 브라우저의 북마크를 앱으로 가져옵니다. 이미 있는 URL은 건너뜁니다.",
    "progress": "{{current}} / {{total}} 처리 중...",
    "done": "완료 — {{total}}개 중 {{current}}개 처리됨",
    "error": "오류: {{message}}",
    "unknownError": "알 수 없는 오류",
    "importing": "가져오는 중... ({{percent}}%)",
    "reimport": "다시 가져오기",
    "import": "Chrome 북마크 가져오기"
  },
  "language": {
    "label": "언어",
    "languages": {
      "en": "English",
      "ko": "한국어",
      "zh": "中文",
      "ja": "日本語"
    }
  },
  "bookmark": {
    "add": "북마크 추가",
    "edit": "북마크 수정",
    "adding": "추가 중...",
    "editing": "수정 중...",
    "url": "URL",
    "title": "제목",
    "titlePlaceholder": "제목",
    "description": "설명",
    "descriptionPlaceholder": "설명 (선택)",
    "folder": "폴더",
    "tag": "태그",
    "syncError": "Chrome 북마크 동기화에 실패했습니다."
  },
  "tag": {
    "add": "태그 추가",
    "edit": "태그 편집",
    "name": "이름",
    "namePlaceholder": "태그 이름",
    "color": "색상",
    "customColor": "직접 입력",
    "preview": "미리보기",
    "adding": "추가 중...",
    "saving": "저장 중...",
    "delete": "삭제"
  },
  "folder": {
    "new": "새 폴더",
    "rename": "폴더 이름 변경",
    "name": "이름",
    "namePlaceholder": "폴더 이름",
    "createInside": "안에 생성됩니다",
    "adding": "추가 중...",
    "saving": "저장 중...",
    "addChild": "하위 폴더 추가",
    "rename_action": "이름 변경",
    "delete": "삭제",
    "deleteConfirm": "폴더를 삭제하시겠습니까? 하위 폴더와 북마크도 함께 삭제됩니다.",
    "syncError": "Chrome 폴더 동기화에 실패했습니다.",
    "deleteError": "폴더 삭제에 실패했습니다.",
    "saveEnter": "저장 (Enter)",
    "cancelEsc": "취소 (Esc)",
    "collapse": "접기",
    "expand": "펼치기"
  },
  "sidebar": {
    "folders": "폴더",
    "addFolder": "폴더 추가",
    "tags": "태그",
    "addTag": "태그 추가",
    "all": "전체",
    "editTag": "편집"
  },
  "header": {
    "addBookmark": "북마크 추가",
    "settings": "설정"
  },
  "bookmarkList": {
    "loadError": "북마크를 불러오는 중 오류가 발생했습니다",
    "unknownError": "알 수 없는 오류",
    "empty": "북마크가 없습니다",
    "reorderSyncError": "Chrome 북마크 순서 동기화에 실패했습니다.",
    "reorderError": "북마크 순서 변경에 실패했습니다."
  },
  "filterBar": {
    "folders": "폴더",
    "tags": "태그",
    "all": "전체",
    "addFolder": "폴더 추가",
    "addTag": "태그 추가"
  },
  "search": {
    "bookmarkLabel": "북마크",
    "bookmarkPlaceholder": "저장한 북마크 검색...",
    "bookmarkAriaLabel": "북마크 검색",
    "clearAriaLabel": "검색어 지우기",
    "googleAriaLabel": "Google 검색 또는 URL 입력",
    "googlePlaceholder": "검색어 또는 URL 입력...",
    "googleHomeAriaLabel": "Google 홈으로 이동",
    "googleHomeTitle": "google.com으로 이동",
    "searchButton": "검색",
    "go": "이동"
  },
  "common": {
    "cancel": "취소",
    "save": "저장",
    "add": "추가",
    "edit": "수정"
  }
}
```

**Step 3: Create `apps/web/src/locales/zh/translation.json`**

```json
{
  "settings": {
    "title": "设置",
    "description": "应用设置和数据管理",
    "sections": {
      "viewMode": {
        "label": "视图",
        "description": "选择显示书签列表的布局。"
      },
      "theme": {
        "label": "主题",
        "description": "选择应用的颜色主题。"
      },
      "realtimeSync": {
        "label": "同步",
        "description": "设置与 Chrome 书签的实时同步方向。"
      },
      "chromeImport": {
        "label": "Chrome 导入",
        "description": "将 Chrome 浏览器的书签导入到应用中。"
      },
      "language": {
        "label": "语言",
        "description": "选择应用的显示语言。"
      }
    }
  },
  "theme": {
    "label": "主题",
    "light": "浅色",
    "dark": "深色",
    "system": "系统",
    "switchToLight": "切换到浅色模式",
    "switchToDark": "切换到深色模式"
  },
  "viewMode": {
    "label": "视图模式",
    "glass": "磨砂",
    "grid": "网格",
    "list": "列表"
  },
  "sync": {
    "label": "实时同步",
    "save": "保存",
    "warning": "⚠ 根据同步设置，Chrome 书签可能会被删除。建议先导出 Chrome 书签（{{path}}）。",
    "warningPath": "Chrome 设置 → 书签 → 导出书签",
    "options": {
      "off": {
        "label": "不同步",
        "description": "禁用 Chrome 书签与应用之间的自动同步。"
      },
      "chromeToWeb": {
        "label": "Chrome → Web",
        "description": "Chrome 书签变更时自动同步到应用。",
        "warning": "⚠ 在 Chrome 中删除书签后，应用中也会永久删除。"
      },
      "webToChrome": {
        "label": "Web → Chrome",
        "description": "应用书签变更时自动同步到 Chrome 书签。",
        "warning": "⚠ 在应用中删除书签后，Chrome 中也会永久删除。"
      },
      "bidirectional": {
        "label": "双向",
        "description": "应用和 Chrome 书签双向自动同步。",
        "warning": "⚠ 任意一方删除都会在两端永久删除。"
      }
    }
  },
  "chromeImport": {
    "title": "导入 Chrome 书签",
    "description": "将当前 Chrome 浏览器的书签导入到应用中。已存在的 URL 将被跳过。",
    "progress": "{{current}} / {{total}} 处理中...",
    "done": "完成 — 已处理 {{total}} 个中的 {{current}} 个",
    "error": "错误：{{message}}",
    "unknownError": "未知错误",
    "importing": "导入中... ({{percent}}%)",
    "reimport": "重新导入",
    "import": "导入 Chrome 书签"
  },
  "language": {
    "label": "语言",
    "languages": {
      "en": "English",
      "ko": "한국어",
      "zh": "中文",
      "ja": "日本語"
    }
  },
  "bookmark": {
    "add": "添加书签",
    "edit": "编辑书签",
    "adding": "添加中...",
    "editing": "编辑中...",
    "url": "URL",
    "title": "标题",
    "titlePlaceholder": "标题",
    "description": "描述",
    "descriptionPlaceholder": "描述（可选）",
    "folder": "文件夹",
    "tag": "标签",
    "syncError": "Chrome 书签同步失败。"
  },
  "tag": {
    "add": "添加标签",
    "edit": "编辑标签",
    "name": "名称",
    "namePlaceholder": "标签名称",
    "color": "颜色",
    "customColor": "自定义",
    "preview": "预览",
    "adding": "添加中...",
    "saving": "保存中...",
    "delete": "删除"
  },
  "folder": {
    "new": "新建文件夹",
    "rename": "重命名文件夹",
    "name": "名称",
    "namePlaceholder": "文件夹名称",
    "createInside": "将在其中创建",
    "adding": "添加中...",
    "saving": "保存中...",
    "addChild": "添加子文件夹",
    "rename_action": "重命名",
    "delete": "删除",
    "deleteConfirm": "确定要删除此文件夹吗？子文件夹和书签也将一并删除。",
    "syncError": "Chrome 文件夹同步失败。",
    "deleteError": "删除文件夹失败。",
    "saveEnter": "保存 (Enter)",
    "cancelEsc": "取消 (Esc)",
    "collapse": "收起",
    "expand": "展开"
  },
  "sidebar": {
    "folders": "文件夹",
    "addFolder": "添加文件夹",
    "tags": "标签",
    "addTag": "添加标签",
    "all": "全部",
    "editTag": "编辑"
  },
  "header": {
    "addBookmark": "添加书签",
    "settings": "设置"
  },
  "bookmarkList": {
    "loadError": "加载书签时出错",
    "unknownError": "未知错误",
    "empty": "暂无书签",
    "reorderSyncError": "Chrome 书签排序同步失败。",
    "reorderError": "书签排序失败。"
  },
  "filterBar": {
    "folders": "文件夹",
    "tags": "标签",
    "all": "全部",
    "addFolder": "添加文件夹",
    "addTag": "添加标签"
  },
  "search": {
    "bookmarkLabel": "书签",
    "bookmarkPlaceholder": "搜索已保存的书签...",
    "bookmarkAriaLabel": "搜索书签",
    "clearAriaLabel": "清除搜索",
    "googleAriaLabel": "Google 搜索或输入 URL",
    "googlePlaceholder": "搜索或输入 URL...",
    "googleHomeAriaLabel": "前往 Google 主页",
    "googleHomeTitle": "前往 google.com",
    "searchButton": "搜索",
    "go": "前往"
  },
  "common": {
    "cancel": "取消",
    "save": "保存",
    "add": "添加",
    "edit": "编辑"
  }
}
```

**Step 4: Create `apps/web/src/locales/ja/translation.json`**

```json
{
  "settings": {
    "title": "設定",
    "description": "アプリの設定とデータ管理",
    "sections": {
      "viewMode": {
        "label": "表示",
        "description": "ブックマーク一覧のレイアウトを選択します。"
      },
      "theme": {
        "label": "テーマ",
        "description": "アプリのカラーテーマを選択します。"
      },
      "realtimeSync": {
        "label": "同期",
        "description": "Chrome ブックマークとのリアルタイム同期方向を設定します。"
      },
      "chromeImport": {
        "label": "Chrome インポート",
        "description": "Chrome ブラウザのブックマークをアプリにインポートします。"
      },
      "language": {
        "label": "言語",
        "description": "アプリの表示言語を選択します。"
      }
    }
  },
  "theme": {
    "label": "テーマ",
    "light": "ライト",
    "dark": "ダーク",
    "system": "システム",
    "switchToLight": "ライトモードに切り替え",
    "switchToDark": "ダークモードに切り替え"
  },
  "viewMode": {
    "label": "表示モード",
    "glass": "グラス",
    "grid": "グリッド",
    "list": "リスト"
  },
  "sync": {
    "label": "リアルタイム同期",
    "save": "保存",
    "warning": "⚠ 同期設定によっては Chrome ブックマークが削除される場合があります。事前に Chrome ブックマークをエクスポート（{{path}}）することをお勧めします。",
    "warningPath": "Chrome 設定 → ブックマーク → ブックマークをエクスポート",
    "options": {
      "off": {
        "label": "同期しない",
        "description": "Chrome ブックマークとアプリ間の自動同期を無効にします。"
      },
      "chromeToWeb": {
        "label": "Chrome → Web",
        "description": "Chrome ブックマークの変更がアプリに自動反映されます。",
        "warning": "⚠ Chrome でブックマークを削除するとアプリでも完全に削除されます。"
      },
      "webToChrome": {
        "label": "Web → Chrome",
        "description": "アプリのブックマーク変更が Chrome ブックマークに自動反映されます。",
        "warning": "⚠ アプリでブックマークを削除すると Chrome でも完全に削除されます。"
      },
      "bidirectional": {
        "label": "双方向",
        "description": "アプリと Chrome ブックマークが双方向で自動同期されます。",
        "warning": "⚠ どちら側で削除しても両方から完全に削除されます。"
      }
    }
  },
  "chromeImport": {
    "title": "Chrome ブックマークをインポート",
    "description": "現在の Chrome ブラウザのブックマークをアプリにインポートします。既存の URL はスキップされます。",
    "progress": "{{current}} / {{total}} 処理中...",
    "done": "完了 — {{total}} 件中 {{current}} 件処理済み",
    "error": "エラー: {{message}}",
    "unknownError": "不明なエラー",
    "importing": "インポート中... ({{percent}}%)",
    "reimport": "再インポート",
    "import": "Chrome ブックマークをインポート"
  },
  "language": {
    "label": "言語",
    "languages": {
      "en": "English",
      "ko": "한국어",
      "zh": "中文",
      "ja": "日本語"
    }
  },
  "bookmark": {
    "add": "ブックマークを追加",
    "edit": "ブックマークを編集",
    "adding": "追加中...",
    "editing": "編集中...",
    "url": "URL",
    "title": "タイトル",
    "titlePlaceholder": "タイトル",
    "description": "説明",
    "descriptionPlaceholder": "説明（任意）",
    "folder": "フォルダ",
    "tag": "タグ",
    "syncError": "Chrome ブックマークの同期に失敗しました。"
  },
  "tag": {
    "add": "タグを追加",
    "edit": "タグを編集",
    "name": "名前",
    "namePlaceholder": "タグ名",
    "color": "カラー",
    "customColor": "カスタム",
    "preview": "プレビュー",
    "adding": "追加中...",
    "saving": "保存中...",
    "delete": "削除"
  },
  "folder": {
    "new": "新しいフォルダ",
    "rename": "フォルダ名を変更",
    "name": "名前",
    "namePlaceholder": "フォルダ名",
    "createInside": "の中に作成されます",
    "adding": "追加中...",
    "saving": "保存中...",
    "addChild": "サブフォルダを追加",
    "rename_action": "名前を変更",
    "delete": "削除",
    "deleteConfirm": "このフォルダを削除しますか？サブフォルダとブックマークも一緒に削除されます。",
    "syncError": "Chrome フォルダの同期に失敗しました。",
    "deleteError": "フォルダの削除に失敗しました。",
    "saveEnter": "保存 (Enter)",
    "cancelEsc": "キャンセル (Esc)",
    "collapse": "折りたたむ",
    "expand": "展開する"
  },
  "sidebar": {
    "folders": "フォルダ",
    "addFolder": "フォルダを追加",
    "tags": "タグ",
    "addTag": "タグを追加",
    "all": "すべて",
    "editTag": "編集"
  },
  "header": {
    "addBookmark": "ブックマークを追加",
    "settings": "設定"
  },
  "bookmarkList": {
    "loadError": "ブックマークの読み込み中にエラーが発生しました",
    "unknownError": "不明なエラー",
    "empty": "ブックマークがありません",
    "reorderSyncError": "Chrome ブックマークの順序同期に失敗しました。",
    "reorderError": "ブックマークの並び替えに失敗しました。"
  },
  "filterBar": {
    "folders": "フォルダ",
    "tags": "タグ",
    "all": "すべて",
    "addFolder": "フォルダを追加",
    "addTag": "タグを追加"
  },
  "search": {
    "bookmarkLabel": "ブックマーク",
    "bookmarkPlaceholder": "保存したブックマークを検索...",
    "bookmarkAriaLabel": "ブックマークを検索",
    "clearAriaLabel": "検索をクリア",
    "googleAriaLabel": "Google 検索または URL を入力",
    "googlePlaceholder": "検索または URL を入力...",
    "googleHomeAriaLabel": "Google ホームへ移動",
    "googleHomeTitle": "google.com へ移動",
    "searchButton": "検索",
    "go": "移動"
  },
  "common": {
    "cancel": "キャンセル",
    "save": "保存",
    "add": "追加",
    "edit": "編集"
  }
}
```

**Step 5: Commit**

```bash
git add apps/web/src/locales/
git commit -m "feat(web/i18n): add locale translation files (en, ko, zh, ja)"
```

---

## Task 3: Set up i18n module

**Files:**

- Create: `apps/web/src/shared/lib/i18n/i18n.ts`
- Create: `apps/web/src/shared/lib/i18n/I18nProvider.tsx`
- Create: `apps/web/src/shared/lib/i18n/index.ts`

**Step 1: Create `apps/web/src/shared/lib/i18n/i18n.ts`**

```typescript
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en/translation.json';
import ja from '@/locales/ja/translation.json';
import ko from '@/locales/ko/translation.json';
import zh from '@/locales/zh/translation.json';

export const SUPPORTED_LANGUAGES = ['en', 'ko', 'zh', 'ja'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18n
 .use(LanguageDetector)
 .use(initReactI18next)
 .init({
  resources: {
   en: { translation: en },
   ko: { translation: ko },
   zh: { translation: zh },
   ja: { translation: ja },
  },
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES,
  detection: {
   order: ['localStorage', 'navigator'],
   caches: ['localStorage'],
   lookupLocalStorage: 'i18n_language',
  },
  interpolation: {
   escapeValue: false,
  },
 });

export default i18n;
```

**Step 2: Create `apps/web/src/shared/lib/i18n/I18nProvider.tsx`**

```typescript
import type { ReactNode } from 'react';
import './i18n';

export function I18nProvider({ children }: { children: ReactNode }) {
 return <>{children}</>;
}
```

**Step 3: Create `apps/web/src/shared/lib/i18n/index.ts`**

```typescript
export { I18nProvider } from './I18nProvider';
export { default as i18n, SUPPORTED_LANGUAGES, type SupportedLanguage } from './i18n';
```

**Step 4: Verify TypeScript compiles**

```bash
pnpm check-types
```

**Step 5: Commit**

```bash
git add apps/web/src/shared/lib/i18n/
git commit -m "feat(web/i18n): set up i18next with browser language detection"
```

---

## Task 4: Add I18nProvider to app providers

**Files:**

- Modify: `apps/web/src/app/providers/index.tsx`

**Step 1: Add I18nProvider import and wrap app**

Replace the file content:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { setAuthToken } from '@/shared/api';
import { I18nProvider } from '@/shared/lib/i18n';
import { StorageProvider } from '@/shared/lib/storage';
import { ThemeProvider } from '@/shared/lib/theme';

// Initialize axios token on app start
const token = localStorage.getItem('auth_token');
if (token) setAuthToken(token);

const queryClient = new QueryClient({
 defaultOptions: {
  queries: { staleTime: 1000 * 60, retry: 1 },
 },
});

export function Providers({ children }: { children: ReactNode }) {
 return (
  <I18nProvider>
   <ThemeProvider>
    <QueryClientProvider client={queryClient}>
     <StorageProvider>{children}</StorageProvider>
     <Toaster position='bottom-right' richColors />
    </QueryClientProvider>
   </ThemeProvider>
  </I18nProvider>
 );
}
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm check-types
```

**Step 3: Commit**

```bash
git add apps/web/src/app/providers/index.tsx
git commit -m "feat(web/i18n): add I18nProvider to app providers"
```

---

## Task 5: Update Settings sections to use translation keys

**Files:**

- Modify: `apps/web/src/features/settings/ui/sections.ts`

The `SETTINGS_SECTIONS` array currently holds display strings. Change `label` and `description` to translation keys so components can call `t(section.labelKey)`.

**Step 1: Modify `apps/web/src/features/settings/ui/sections.ts`**

```typescript
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
```

**Step 2: Commit**

```bash
git add apps/web/src/features/settings/ui/sections.ts
git commit -m "feat(web/i18n): convert settings sections to use translation keys"
```

---

## Task 6: Create LanguageSection component

**Files:**

- Create: `apps/web/src/features/settings/ui/sections/LanguageSection.tsx`

**Step 1: Create `apps/web/src/features/settings/ui/sections/LanguageSection.tsx`**

```typescript
import { Label } from '@bookmark/ui/components/label';
import { cn } from '@bookmark/ui/lib/utils';
import { useTranslation } from 'react-i18next';
import { type SupportedLanguage, SUPPORTED_LANGUAGES } from '@/shared/lib/i18n';

export function LanguageSection() {
 const { t, i18n } = useTranslation();
 const currentLang = i18n.language as SupportedLanguage;

 function handleChange(lang: SupportedLanguage) {
  i18n.changeLanguage(lang);
 }

 return (
  <div className='flex flex-col gap-2'>
   <Label>{t('language.label')}</Label>
   <div className='flex flex-col gap-1.5'>
    {SUPPORTED_LANGUAGES.map((lang) => (
     <button
      className={cn(
       'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all text-left',
       currentLang === lang
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground',
      )}
      key={lang}
      onClick={() => handleChange(lang)}
      type='button'
     >
      <span className='font-medium'>{t(`language.languages.${lang}`)}</span>
     </button>
    ))}
   </div>
  </div>
 );
}
```

**Step 2: Verify TypeScript compiles**

```bash
pnpm check-types
```

**Step 3: Commit**

```bash
git add apps/web/src/features/settings/ui/sections/LanguageSection.tsx
git commit -m "feat(web/i18n): add LanguageSection to settings"
```

---

## Task 7: Translate SettingsDialog

**Files:**

- Modify: `apps/web/src/features/settings/ui/SettingsDialog.tsx`

**Step 1: Apply `useTranslation` and replace hardcoded strings**

Key changes:

- Add `import { useTranslation } from 'react-i18next';`
- In `SettingsDialog`, call `const { t } = useTranslation();`
- Replace `'설정'` (DialogTitle) → `{t('settings.title')}`
- Replace `'앱 설정 및 데이터 관리'` → `{t('settings.description')}`
- Replace `{section.label}` → `{t(section.labelKey)}`
- Replace `{activeSection?.label}` → `{activeSection ? t(activeSection.labelKey) : ''}`
- Replace `{activeSection?.description && ...}` → check `activeSection?.descriptionKey` and use `t(activeSection.descriptionKey)`

**Step 2: Verify TypeScript compiles**

```bash
pnpm check-types
```

**Step 3: Commit**

```bash
git add apps/web/src/features/settings/ui/SettingsDialog.tsx
git commit -m "feat(web/i18n): translate SettingsDialog"
```

---

## Task 8: Translate ThemeSection

**Files:**

- Modify: `apps/web/src/features/settings/ui/sections/ThemeSection.tsx`

**Step 1: Apply translations**

Change `THEME_OPTIONS` to use `t()` inside the component (move inside function or use translation keys):

```typescript
import { Label } from '@bookmark/ui/components/label';
import { useTranslation } from 'react-i18next';
import type { Theme } from '@/shared/lib/theme';
import { useTheme } from '@/shared/lib/theme';

const THEME_VALUES: { value: Theme; icon: string }[] = [
 { value: 'light', icon: '☀️' },
 { value: 'dark', icon: '🌙' },
 { value: 'system', icon: '💻' },
];

export function ThemeSection() {
 const { theme, setTheme } = useTheme();
 const { t } = useTranslation();

 return (
  <div className='flex flex-col gap-2'>
   <Label>{t('theme.label')}</Label>
   <div className='flex gap-2'>
    {THEME_VALUES.map((option) => (
     <button
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all ${
       theme === option.value
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
      }`}
      key={option.value}
      onClick={() => setTheme(option.value)}
      type='button'
     >
      <span aria-hidden='true'>{option.icon}</span>
      {t(`theme.${option.value}`)}
     </button>
    ))}
   </div>
  </div>
 );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/settings/ui/sections/ThemeSection.tsx
git commit -m "feat(web/i18n): translate ThemeSection"
```

---

## Task 9: Translate ViewModeSection

**Files:**

- Modify: `apps/web/src/features/settings/ui/sections/ViewModeSection.tsx`

**Step 1: Move labels out of static array, use `t()` for label text**

The SVG preview/icon nodes remain static. Only the `label` string changes. Replace the `label` field with a key and use `t(`viewMode.${option.value}`)` in JSX. Move array definition inside the component or extract only value+icon+preview (no label).

```typescript
// At top of file, keep value/icon/preview; add useTranslation inside component
const VIEW_MODE_OPTIONS: { value: ViewMode; icon: ReactNode; preview: ReactNode }[] = [
  { value: 'glass', icon: <...>, preview: <...> },
  { value: 'grid',  icon: <...>, preview: <...> },
  { value: 'list',  icon: <...>, preview: <...> },
];

export function ViewModeSection() {
 const { viewMode, setViewMode } = useSettingStore();
 const { t } = useTranslation();

 return (
  <div className='flex flex-col gap-2'>
   <Label>{t('viewMode.label')}</Label>
   <div className='flex gap-2'>
    {VIEW_MODE_OPTIONS.map((option) => (
     <button ... key={option.value} onClick={() => setViewMode(option.value)} type='button'>
      ...
      <div className='flex items-center gap-1'>
       {option.icon}
       {t(`viewMode.${option.value}`)}
      </div>
     </button>
    ))}
   </div>
  </div>
 );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/settings/ui/sections/ViewModeSection.tsx
git commit -m "feat(web/i18n): translate ViewModeSection"
```

---

## Task 10: Translate RealtimeSyncSection

**Files:**

- Modify: `apps/web/src/features/settings/ui/sections/RealtimeSyncSection.tsx`

**Step 1: Apply translations**

Replace `SYNC_OPTIONS` static labels/descriptions with translation keys. Use `t()` in rendering. The sync option values `off | chrome-to-web | web-to-chrome | bidirectional` map to keys `sync.options.off | chromeToWeb | webToChrome | bidirectional`.

```typescript
import { useTranslation } from 'react-i18next';

const SYNC_OPTION_VALUES: { value: SyncMode; key: string }[] = [
  { value: 'off',           key: 'off' },
  { value: 'chrome-to-web', key: 'chromeToWeb' },
  { value: 'web-to-chrome', key: 'webToChrome' },
  { value: 'bidirectional', key: 'bidirectional' },
];

export function RealtimeSyncSection() {
  const { syncMode, setSyncMode } = useSettingStore();
  const [localSyncMode, setLocalSyncMode] = useState<SyncMode>(syncMode);
  const isDirty = localSyncMode !== syncMode;
  const { t } = useTranslation();

  // ... handleSave unchanged

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium'>{t('sync.label')}</span>
        <Button disabled={!isDirty} onClick={handleSave} size='sm'>
          {t('sync.save')}
        </Button>
      </div>
      <div className='rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400'>
        ⚠ {t('sync.warning', { path: t('sync.warningPath') })}
      </div>
      <div className='flex flex-col gap-2'>
        {SYNC_OPTION_VALUES.map(({ value, key }) => (
          <button
            className={cn(...)}
            key={value}
            onClick={() => setLocalSyncMode(value)}
            type='button'
          >
            <span className='text-sm font-medium'>{t(`sync.options.${key}.label`)}</span>
            <span className='text-xs'>{t(`sync.options.${key}.description`)}</span>
            {localSyncMode === value && t(`sync.options.${key}.warning`) && (
              <span className='mt-0.5 text-xs text-destructive'>
                {t(`sync.options.${key}.warning`)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/settings/ui/sections/RealtimeSyncSection.tsx
git commit -m "feat(web/i18n): translate RealtimeSyncSection"
```

---

## Task 11: Translate ChromeImportSection

**Files:**

- Modify: `apps/web/src/features/settings/ui/sections/ChromeImportSection.tsx`

**Step 1: Apply translations**

Add `const { t } = useTranslation();` and replace all Korean strings:

- `'Chrome 북마크 가져오기'` → `t('chromeImport.title')`
- `'현재 Chrome 브라우저의...'` → `t('chromeImport.description')`
- Progress text: `t('chromeImport.done', { current: progress.current, total: progress.total })` and `t('chromeImport.progress', { current: progress.current, total: progress.total })`
- Error: `t('chromeImport.error', { message: progress.error ?? t('chromeImport.unknownError') })`
- Button: `t('chromeImport.importing', { percent: progressPercent })` / `t('chromeImport.reimport')` / `t('chromeImport.import')`

**Step 2: Commit**

```bash
git add apps/web/src/features/settings/ui/sections/ChromeImportSection.tsx
git commit -m "feat(web/i18n): translate ChromeImportSection"
```

---

## Task 12: Translate BookmarkFormFields

**Files:**

- Modify: `apps/web/src/features/bookmark/ui/BookmarkFormFields.tsx`

**Step 1: Apply translations**

Add `useTranslation` and replace:

- `'제목 *'` → `` `${t('bookmark.title')} *` ``
- `'제목'` (placeholder) → `t('bookmark.titlePlaceholder')`
- `'설명'` → `t('bookmark.description')`
- `'설명 (선택)'` → `t('bookmark.descriptionPlaceholder')`
- `'폴더'` → `t('bookmark.folder')`
- `'태그'` → `t('bookmark.tag')`

**Step 2: Commit**

```bash
git add apps/web/src/features/bookmark/ui/BookmarkFormFields.tsx
git commit -m "feat(web/i18n): translate BookmarkFormFields"
```

---

## Task 13: Translate BookmarkCreateDialog and BookmarkEditDialog

**Files:**

- Modify: `apps/web/src/features/bookmark/ui/BookmarkCreateDialog.tsx`
- Modify: `apps/web/src/features/bookmark/ui/BookmarkEditDialog.tsx`

**Step 1: Translate BookmarkCreateDialog**

Add `useTranslation` and replace:

- `'북마크 추가'` (DialogTitle) → `t('bookmark.add')`
- `'취소'` → `t('common.cancel')`
- `isPending ? '추가 중...' : '추가'` → `isPending ? t('bookmark.adding') : t('common.add')`
- `toast.error('Chrome 북마크 동기화에 실패했습니다.')` → `toast.error(t('bookmark.syncError'))`

**Step 2: Translate BookmarkEditDialog**

- `'북마크 수정'` → `t('bookmark.edit')`
- `'취소'` → `t('common.cancel')`
- `isPending ? '수정 중...' : '수정'` → `isPending ? t('bookmark.editing') : t('common.edit')`
- `toast.error(...)` → `toast.error(t('bookmark.syncError'))`

**Step 3: Commit**

```bash
git add apps/web/src/features/bookmark/ui/BookmarkCreateDialog.tsx apps/web/src/features/bookmark/ui/BookmarkEditDialog.tsx
git commit -m "feat(web/i18n): translate bookmark dialogs"
```

---

## Task 14: Translate TagCreateDialog and TagEditDialog

**Files:**

- Modify: `apps/web/src/features/tag-manage/ui/TagCreateDialog.tsx`
- Modify: `apps/web/src/features/tag-manage/ui/TagEditDialog.tsx`

**Step 1: Translate TagCreateDialog**

- `'태그 추가'` (title) → `t('tag.add')`
- `'이름 *'` → `` `${t('tag.name')} *` ``
- `'태그 이름'` (placeholder) → `t('tag.namePlaceholder')`
- `'색상'` → `t('tag.color')`
- `'직접 입력'` (title) → `t('tag.customColor')`
- `'미리보기'` → `t('tag.preview')`
- `'취소'` → `t('common.cancel')`
- `isPending ? '추가 중...' : '추가'` → `isPending ? t('tag.adding') : t('common.add')`

**Step 2: Translate TagEditDialog**

- `'태그 편집'` → `t('tag.edit')`
- `'이름 *'` → `` `${t('tag.name')} *` ``
- `'태그 이름'` placeholder → `t('tag.namePlaceholder')`
- `'색상'` → `t('tag.color')`
- `'직접 입력'` → `t('tag.customColor')`
- `'미리보기'` → `t('tag.preview')`
- `'삭제'` → `t('tag.delete')`
- `'취소'` → `t('common.cancel')`
- `isEditing ? '저장 중...' : '저장'` → `isEditing ? t('tag.saving') : t('common.save')`

**Step 3: Commit**

```bash
git add apps/web/src/features/tag-manage/ui/
git commit -m "feat(web/i18n): translate tag dialogs"
```

---

## Task 15: Translate FolderCreateDialog and FolderEditDialog

**Files:**

- Modify: `apps/web/src/features/folder-manage/ui/FolderCreateDialog.tsx`
- Modify: `apps/web/src/features/folder-manage/ui/FolderEditDialog.tsx`

**Step 1: Translate FolderCreateDialog**

- `'새 폴더'` → `t('folder.new')`
- `'안에 생성됩니다'` → `t('folder.createInside')`
- `'이름 *'` → `` `${t('folder.name')} *` ``
- `'폴더 이름'` (placeholder) → `t('folder.namePlaceholder')`
- `'취소'` → `t('common.cancel')`
- `isPending ? '추가 중...' : '추가'` → `isPending ? t('folder.adding') : t('common.add')`
- `toast.error('Chrome 폴더 동기화에 실패했습니다.')` → `toast.error(t('folder.syncError'))`

**Step 2: Translate FolderEditDialog**

- `'폴더 이름 변경'` → `t('folder.rename')`
- `'이름 *'` → `` `${t('folder.name')} *` ``
- `'폴더 이름'` placeholder → `t('folder.namePlaceholder')`
- `'취소'` → `t('common.cancel')`
- `isPending ? '저장 중...' : '저장'` → `isPending ? t('folder.saving') : t('common.save')`

**Step 3: Commit**

```bash
git add apps/web/src/features/folder-manage/ui/
git commit -m "feat(web/i18n): translate folder dialogs"
```

---

## Task 16: Translate Sidebar

**Files:**

- Modify: `apps/web/src/widgets/sidebar/ui/Sidebar.tsx`

**Step 1: Apply translations**

- `'폴더 추가'` (addTitle) → `t('sidebar.addFolder')`
- `'폴더'` (label) → `t('sidebar.folders')`
- `'전체'` → `t('sidebar.all')`
- `'태그 추가'` (addTitle) → `t('sidebar.addTag')`
- `'태그'` (label) → `t('sidebar.tags')`
- `'편집'` (title) → `t('sidebar.editTag')`

`useTranslation` must be called inside each sub-component or passed as prop. The cleanest approach: call `useTranslation` inside `FolderSection` and `TagSection` and `TagRow`.

**Step 2: Commit**

```bash
git add apps/web/src/widgets/sidebar/ui/Sidebar.tsx
git commit -m "feat(web/i18n): translate Sidebar"
```

---

## Task 17: Translate FolderTree

**Files:**

- Modify: `apps/web/src/widgets/sidebar/ui/FolderTree.tsx`

**Step 1: Apply translations**

In `FolderNodeRow`:

- `aria-label={expanded ? '접기' : '펼치기'}` → `{t(expanded ? 'folder.collapse' : 'folder.expand')}`
- `title='하위 폴더 추가'` → `{t('folder.addChild')}`
- `title='이름 변경'` → `{t('folder.rename_action')}`
- `title='삭제'` → `{t('folder.delete')}`
- `title='저장 (Enter)'` → `{t('folder.saveEnter')}`
- `title='취소 (Esc)'` → `{t('folder.cancelEsc')}`

In `FolderTree.handleDelete`:

- `window.confirm('폴더를 삭제하시겠습니까?...')` — `confirm` is synchronous; pass translated string: `window.confirm(t('folder.deleteConfirm'))`
- `toast.error('Chrome 폴더 동기화에 실패했습니다.')` → `toast.error(t('folder.syncError'))`
- `toast.error('폴더 삭제에 실패했습니다.')` → `toast.error(t('folder.deleteError'))`

Note: `t` must be obtained via `useTranslation()` inside the `FolderTree` component and passed down, or called inside `FolderNodeRow` directly.

**Step 2: Commit**

```bash
git add apps/web/src/widgets/sidebar/ui/FolderTree.tsx
git commit -m "feat(web/i18n): translate FolderTree"
```

---

## Task 18: Translate Header

**Files:**

- Modify: `apps/web/src/widgets/header/ui/Header.tsx`

**Step 1: Apply translations**

- `title={resolvedTheme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}` → `t(resolvedTheme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark')`
- `title='설정'` → `t('header.settings')`
- `'북마크 추가'` (button text) → `t('header.addBookmark')`

**Step 2: Commit**

```bash
git add apps/web/src/widgets/header/ui/Header.tsx
git commit -m "feat(web/i18n): translate Header"
```

---

## Task 19: Translate BookmarkList

**Files:**

- Modify: `apps/web/src/widgets/bookmark-list/ui/BookmarkList.tsx`

**Step 1: Apply translations**

- `'북마크를 불러오는 중 오류가 발생했습니다'` → `t('bookmarkList.loadError')`
- `'알 수 없는 오류'` → `t('bookmarkList.unknownError')`
- `'북마크가 없습니다'` → `t('bookmarkList.empty')`
- `toast.error('Chrome 북마크 순서 동기화에 실패했습니다.')` → `toast.error(t('bookmarkList.reorderSyncError'))`
- `toast.error('북마크 순서 변경에 실패했습니다.')` → `toast.error(t('bookmarkList.reorderError'))`

Note: `BookmarkListError` and `BookmarkListEmpty` are inner components — they need `useTranslation()` each, or `t` passed as prop.

**Step 2: Commit**

```bash
git add apps/web/src/widgets/bookmark-list/ui/BookmarkList.tsx
git commit -m "feat(web/i18n): translate BookmarkList"
```

---

## Task 20: Translate GlassFilterBar

**Files:**

- Modify: `apps/web/src/widgets/bookmark-list/ui/GlassFilterBar.tsx`

**Step 1: Apply translations**

- `'폴더'` (label) → `t('filterBar.folders')`
- `'전체'` → `t('filterBar.all')`
- `title='폴더 추가'` → `t('filterBar.addFolder')`
- `'태그'` (label) → `t('filterBar.tags')`
- `title='태그 추가'` → `t('filterBar.addTag')`
- `'태그 추가'` (button text in empty state) → `t('filterBar.addTag')`

**Step 2: Commit**

```bash
git add apps/web/src/widgets/bookmark-list/ui/GlassFilterBar.tsx
git commit -m "feat(web/i18n): translate GlassFilterBar"
```

---

## Task 21: Translate SearchHub

**Files:**

- Modify: `apps/web/src/widgets/search-hub/ui/SearchHub.tsx`

**Step 1: Apply translations**

- `'북마크'` (badge label) → `t('search.bookmarkLabel')`
- `aria-label='북마크 검색'` → `t('search.bookmarkAriaLabel')`
- `placeholder='저장한 북마크 검색...'` → `t('search.bookmarkPlaceholder')`
- `aria-label='검색어 지우기'` → `t('search.clearAriaLabel')`
- `aria-label='Google 홈으로 이동'` → `t('search.googleHomeAriaLabel')`
- `title='google.com으로 이동'` → `t('search.googleHomeTitle')`
- `aria-label='Google 검색 또는 URL 입력'` → `t('search.googleAriaLabel')`
- `placeholder='검색어 또는 URL 입력...'` → `t('search.googlePlaceholder')`
- `title='검색'` → `t('search.searchButton')`

**Step 2: Commit**

```bash
git add apps/web/src/widgets/search-hub/ui/SearchHub.tsx
git commit -m "feat(web/i18n): translate SearchHub"
```

---

## Task 22: Run full quality checks and fix any issues

**Step 1: Run lint/format check**

```bash
pnpm check
```

Fix any issues found.

**Step 2: Run TypeScript check**

```bash
pnpm check-types
```

Fix any type errors.

**Step 3: Run tests**

```bash
pnpm --filter @bookmark/web test
```

Fix any test failures.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(web/i18n): fix lint, type, and test issues after i18n"
```

---

## Task 23: Final verification

**Step 1: Build the app**

```bash
pnpm --filter @bookmark/web build
```

Ensure no build errors.

**Step 2: Manual smoke test checklist**

- [ ] App loads in browser — no console errors
- [ ] Default language matches browser language (or English fallback)
- [ ] Settings → Language section appears and shows 4 languages
- [ ] Clicking Korean → all UI text changes to Korean
- [ ] Clicking English → all UI text changes to English
- [ ] Clicking Chinese → all UI text changes to Chinese
- [ ] Clicking Japanese → all UI text changes to Japanese
- [ ] Refreshing page keeps selected language
- [ ] All dialogs (bookmark, folder, tag create/edit) show translated text
- [ ] Toast messages are translated
- [ ] Confirm dialog (folder delete) is translated

**Step 3: Commit if any final fixes were needed**

```bash
git add -A
git commit -m "fix(web/i18n): final smoke test fixes"
```
