# 실시간 동기화 규칙 설계

**Date:** 2026-03-12
**Status:** Approved
**Approach:** Operation-level Guard

---

## 개요

웹앱과 Chrome 북마크 간 실시간 양방향 동기화의 세부 규칙을 정의한다.
핵심 전략: Guard로 충돌 자체를 방지하고, Web mutation 시 즉시 Chrome에 반영한다.

---

## 섹션 1: SyncMode별 규칙

| 모드 | Source of Truth | 초기 동기화 | 실시간 동기화 |
|------|----------------|------------|--------------|
| `off` | 없음 | 없음 | 없음 |
| `chrome-to-web` | Chrome | Chrome→Web diff | Chrome 이벤트 → Web 반영 |
| `web-to-chrome` | Web | Web→Chrome push | Web mutation → Chrome 반영 |
| `bidirectional` | Guard가 결정 (먼저 작업한 쪽) | Chrome→Web diff → Web→Chrome push | 양방향 |

### 모드별 제약
- `chrome-to-web`: ChromeSyncService 비활성화, Chrome 이벤트 리스너만 활성화
- `web-to-chrome`: Chrome 이벤트 리스너 비활성화, ChromeSyncService만 활성화
- `bidirectional`: 양방향 모두 활성화, Guard로 충돌 방지

---

## 섹션 2: Guard 규칙 (충돌 방지)

**원칙: Guard를 먼저 획득한 쪽이 진행, 상대방 이벤트는 무시**

### Guard 키 형식

| 작업 | Guard 키 | Guard Set |
|------|---------|-----------|
| 북마크 생성 | `"${title}|||${url}"` | `pendingCreates` |
| 북마크 수정 | `"${chromeNodeId}"` | `pendingUpdates` |
| 북마크 삭제 | `"${chromeNodeId}"` | `pendingRemoves` |
| 폴더 생성 | `"folder|||${name}"` | `pendingCreates` |
| 폴더 수정 | `"${chromeNodeId}"` | `pendingUpdates` |
| 폴더 삭제 | `"${chromeNodeId}"` | `pendingRemoves` |

### Guard 흐름

```
[Web mutation 발생]
  → Guard 키 등록
  → ChromeSyncService 호출 (Chrome API)
    → Chrome 이벤트 발생 (onCreated/onChanged/onRemoved)
      → 리스너: Guard 확인 → 키 존재하면 early return (무시)
  → Chrome API 완료
  → Guard 키 제거 (finally 블록)

[Chrome 이벤트 발생 — 사용자 직접 조작]
  → 리스너: Guard 확인 → 키 없으면 정상 처리
  → Web mutation (앱 DB 업데이트)
    ※ Chrome→Web 방향은 리스너만 사용, ChromeSyncService 미사용
```

### 불변 규칙
- Guard 키 등록/해제는 반드시 `try/finally`로 보장
- Chrome 이벤트 리스너는 항상 Guard 체크를 첫 번째로 수행
- Web mutation → ChromeSyncService 호출 시 항상 Guard 등록 후 호출

---

## 섹션 3: 실시간 Web→Chrome 동기화

### 연결 지점

웹앱 mutation 훅의 `onSuccess` 콜백에서 ChromeSyncService 호출:

| Web 작업 | ChromeSyncService 메서드 |
|---------|------------------------|
| 북마크 생성 | `syncCreateBookmark(bookmark)` |
| 북마크 수정 | `syncUpdateBookmark(bookmark)` |
| 북마크 삭제 | `syncDeleteBookmark(bookmarkId)` |
| 폴더 생성 | `syncCreateFolder(folder)` |
| 폴더 수정 | `syncUpdateFolder(folder)` |
| 폴더 삭제 | `syncDeleteFolder(folderId)` |

### 호출 조건
- `syncMode === 'web-to-chrome'` OR `syncMode === 'bidirectional'`
- `ChromeSyncService` 인스턴스가 null이 아닐 것 (Chrome API 존재)
- Guard 등록 → 호출 → Guard 해제 순서 보장

### 실패 처리
- Chrome API 오류 시 토스트 알림만 표시
- 앱 DB는 이미 성공했으므로 롤백 없음
- Web 데이터가 항상 우선 (Chrome sync는 부가 기능)

---

## 섹션 4: 초기 동기화 규칙

### 모드별 실행 순서

**`chrome-to-web`:**
1. Chrome 북마크 트리 순회
2. syncMap에 없는 Chrome 노드 → 앱 DB에 생성
3. Chrome에 없는 앱 데이터 → 앱 DB에서 삭제
4. 완료 → Chrome 이벤트 리스너 등록

**`web-to-chrome`:**
1. 앱 DB 전체 북마크/폴더 순회
2. syncMap에 없는 앱 데이터 → Chrome에 생성 (URL 매칭으로 중복 방지)
3. 완료 → Web mutation 실시간 동기화 활성화

**`bidirectional`:**
1. `chrome-to-web` 초기 동기화 먼저 실행
2. 완료 후 `web-to-chrome` 초기 동기화 실행
3. 완료 → 양방향 실시간 동기화 활성화

### 초기 동기화 중 규칙
- `isSyncing = true` 동안 UI 블락
- 초기 동기화 중 발생하는 Chrome 이벤트는 Guard로 무시
- 초기 동기화 실패 시 토스트 알림, 앱은 sync 없이 정상 진행

---

## 구현 체크리스트

- [ ] Web mutation 훅(`useCreateBookmark`, `useUpdateBookmark`, `useDeleteBookmark`, `useCreateFolder`, `useUpdateFolder`, `useDeleteFolder`)에 ChromeSyncService 호출 추가
- [ ] `chrome-to-web` 모드에서 ChromeSyncService 완전 비활성화 확인
- [ ] `web-to-chrome` 모드에서 Chrome 이벤트 리스너 미등록 확인
- [ ] Guard `try/finally` 패턴 모든 호출 지점에 적용
- [ ] 초기 동기화 중 Chrome 이벤트 Guard 처리 확인
