# Git Worktrees 사용하기

**설명:** 현재 작업 공간에서 격리가 필요한 기능 작업을 시작하거나 구현 계획을 실행하기 전에 사용 - 스마트한 디렉토리 선택 및 안전성 검증을 통해 격리된 git worktree를 생성합니다.

## 개요

Git worktrees는 동일한 저장소를 공유하는 격리된 작업 공간을 생성하여 브랜치를 전환하지 않고도 여러 브랜치에서 동시에 작업할 수 있게 합니다.

**핵심 원칙:** 체계적인 디렉토리 선택 + 안전성 검증 = 안정적인 격리

**시작 시 알림:** "격리된 작업 공간을 설정하기 위해 using-git-worktrees 스킬을 사용하고 있습니다."

## 디렉토리 선택 프로세스

다음 우선순위를 따르세요:

### 1. 기존 디렉토리 확인

```bash
# 우선순위 순서로 확인
ls -d .worktrees 2>/dev/null     # 선호됨 (숨김)
ls -d worktrees 2>/dev/null      # 대안
```

**발견된 경우:** 해당 디렉토리를 사용합니다. 둘 다 존재하면 `.worktrees`가 우선입니다.

### 2. CLAUDE.md 확인

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**설정이 지정된 경우:** 묻지 않고 사용합니다.

### 3. 사용자에게 질문

디렉토리가 없고 CLAUDE.md에 설정이 없는 경우:

```
worktree 디렉토리를 찾을 수 없습니다. 어디에 worktree를 생성할까요?

1. .worktrees/ (프로젝트 로컬, 숨김)
2. ~/.config/superpowers/worktrees/<project-name>/ (전역 위치)

어느 것을 선호하시나요?
```

## 안전성 검증

### 프로젝트 로컬 디렉토리의 경우 (.worktrees 또는 worktrees)

**worktree를 생성하기 전에 디렉토리가 무시되는지 반드시 확인해야 합니다:**

```bash
# 디렉토리가 무시되는지 확인 (로컬, 전역, 시스템 gitignore를 존중)
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**무시되지 않는 경우:**

Jesse의 규칙 "문제를 즉시 수정하라"에 따라:

1. .gitignore에 적절한 라인 추가
2. 변경 사항 커밋
3. worktree 생성 진행

**중요한 이유:** worktree 내용이 실수로 저장소에 커밋되는 것을 방지합니다.

### 전역 디렉토리의 경우 (~/.config/superpowers/worktrees)

.gitignore 검증이 필요 없음 - 프로젝트 외부에 있습니다.

## 생성 단계

### 1. 프로젝트 이름 감지

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. Worktree 생성

```bash
# 전체 경로 결정
case $LOCATION in
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  ~/.config/superpowers/worktrees/*)
    path="~/.config/superpowers/worktrees/$project/$BRANCH_NAME"
    ;;
esac

# 새 브랜치로 worktree 생성
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. 프로젝트 설정 실행

적절한 설정을 자동 감지하고 실행:

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 4. 클린 베이스라인 검증

worktree가 깨끗하게 시작되는지 확인하기 위해 테스트 실행:

```bash
# 예시 - 프로젝트에 적합한 명령어 사용
npm test
cargo test
pytest
go test ./...
```

**테스트 실패 시:** 실패를 보고하고 진행할지 조사할지 질문합니다.

**테스트 통과 시:** 준비 완료를 보고합니다.

### 5. 위치 보고

```
Worktree가 <전체-경로>에 준비되었습니다
테스트 통과 (<N>개 테스트, 0개 실패)
<기능-이름> 구현 준비 완료
```

## 빠른 참조

| 상황 | 조치 |
|-----------|--------|
| `.worktrees/` 존재 | 사용 (무시 확인) |
| `worktrees/` 존재 | 사용 (무시 확인) |
| 둘 다 존재 | `.worktrees/` 사용 |
| 둘 다 없음 | CLAUDE.md 확인 → 사용자에게 질문 |
| 디렉토리가 무시되지 않음 | .gitignore에 추가 + 커밋 |
| 베이스라인 중 테스트 실패 | 실패 보고 + 질문 |
| package.json/Cargo.toml 없음 | 의존성 설치 건너뛰기 |

## 일반적인 실수

### 무시 검증 건너뛰기

- **문제:** Worktree 내용이 추적되고 git status를 오염시킴
- **해결:** 프로젝트 로컬 worktree를 생성하기 전에 항상 `git check-ignore` 사용

### 디렉토리 위치 가정

- **문제:** 일관성 없음, 프로젝트 규칙 위반
- **해결:** 우선순위 따르기: 기존 > CLAUDE.md > 질문

### 실패한 테스트로 진행

- **문제:** 새 버그와 기존 문제를 구별할 수 없음
- **해결:** 실패 보고, 진행에 대한 명시적 허가 받기

### 설정 명령어 하드코딩

- **문제:** 다른 도구를 사용하는 프로젝트에서 중단됨
- **해결:** 프로젝트 파일(package.json 등)에서 자동 감지

## 예시 워크플로우

```
You: 격리된 작업 공간을 설정하기 위해 using-git-worktrees 스킬을 사용하고 있습니다.

[.worktrees/ 확인 - 존재함]
[무시 확인 - git check-ignore가 .worktrees/가 무시됨을 확인]
[worktree 생성: git worktree add .worktrees/auth -b feature/auth]
[npm install 실행]
[npm test 실행 - 47개 통과]

Worktree가 /Users/jesse/myproject/.worktrees/auth에 준비되었습니다
테스트 통과 (47개 테스트, 0개 실패)
인증 기능 구현 준비 완료
```

## 경고 신호

**절대 하지 말 것:**

- 무시되는지 확인하지 않고 worktree 생성 (프로젝트 로컬)
- 베이스라인 테스트 검증 건너뛰기
- 묻지 않고 실패한 테스트로 진행
- 모호할 때 디렉토리 위치 가정
- CLAUDE.md 확인 건너뛰기

**항상 해야 할 것:**

- 디렉토리 우선순위 따르기: 기존 > CLAUDE.md > 질문
- 프로젝트 로컬의 경우 디렉토리가 무시되는지 확인
- 프로젝트 설정 자동 감지 및 실행
- 클린 테스트 베이스라인 검증

## 통합

**호출자:**

- **brainstorming** (Phase 4) - 디자인이 승인되고 구현이 따를 때 필수
- **subagent-driven-development** - 작업 실행 전 필수
- **executing-plans** - 작업 실행 전 필수
- 격리된 작업 공간이 필요한 모든 스킬

**함께 사용:**

- **finishing-a-development-branch** - 작업 완료 후 정리를 위해 필수
