# Brainstorming Skill 핵심 정리

## README.md 내용

### 위치

```
superpowers/
└── README.md
```

### 설명

**brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.

### 워크플로우에서의 위치

```
brainstorming (설계)
    ↓
using-git-worktrees (작업 공간 설정)
    ↓
writing-plans (구현 계획)
    ↓
subagent-driven-development (실행)
```

---

## SKILL.md 핵심 내용

### Frontmatter

```yaml
---
name: brainstorming
description: Help turn ideas into fully formed designs and specs through natural collaborative dialogue. Start by understanding the current project context, then ask questions one at a time to refine the idea.
---
```

### 언제 사용하는가?

- 코드 작성 전
- 기능 개발, 컴포넌트 생성 요청 시
- 창작 작업 (기능, 컴포넌트 추가 등) 전에 필수

### 프로세스

#### 1. Understanding the idea (아이디어 이해)

**현재 프로젝트 상태 먼저 확인:**

- 파일 구조
- 문서
- 최근 커밋

**질문 전략:**

- 한 번에 하나씩 질문
- 가능하면 객관식 선호 (하지만 개방형도 OK)
- 목적, 제약사항, 성공 기준에 집중

#### 2. Exploring approaches (접근법 탐색)

**2-3가지 접근법을 트레이드오프와 함께 제시**

예시:

```
접근법 A: [방법]
장점: ...
단점: ...
적합한 경우: ...

접근법 B: [방법]
장점: ...
단점: ...
적합한 경우: ...
```

#### 3. Presenting design (설계 제시)

**200-300단어 섹션으로 나누어 제시**

- 한 섹션 제시
- 검증 받기 ("괜찮아 보이시나요?")
- 다음 섹션 진행

예시 섹션:

- 아키텍처 개요
- 데이터 모델
- API 엔드포인트
- UI 컴포넌트

### 핵심 원칙

**1. One question at a time** - 메시지당 하나의 질문만

**2. Multiple choice preferred** - 가능하면 객관식

**3. YAGNI ruthlessly** - 불필요한 기능 무자비하게 제거

**4. Explore alternatives** - 항상 2-3가지 접근법 제시

**5. Incremental validation** - 섹션별로 검증

**6. Be flexible** - 이해 안 되면 돌아가서 명확히

### 다음 단계

**설계 문서 저장 후:**

```
Use superpowers:using-git-worktrees to create isolated workspace
→ Use superpowers:writing-plans to create detailed implementation plan
```

### 출력물

**저장 위치:**

```
docs/designs/YYYY-MM-DD-<feature-name>.md
```

**문서 구조:**

```markdown
# [Feature Name] Design

## Overview
[전체 시스템 개요]

## Architecture
[아키텍처 설명]

## Data Models
[데이터 모델]

## API/Components
[API 또는 컴포넌트]

## Implementation Notes
[구현 시 유의사항]
```

---

## 실제 사용 예시

### 입력

```
User: "사용자 인증 시스템을 만들어줘"
```

### 프로세스

```
1. 프로젝트 탐색
   Agent: [README.md, package.json 등 확인]
   
2. 아이디어 이해
   Agent: "어떤 인증 방식을 사용하시겠습니까?
          A) Session 기반
          B) JWT 토큰
          C) OAuth 2.0"
   
   User: "JWT로"
   
   Agent: "토큰 만료 시간은 얼마로 하시겠습니까?"
   User: "1시간"

3. 접근법 탐색
   Agent: "JWT 구현에 2가지 접근법이 있습니다:
          
          접근법 A: 단순 JWT
          - 장점: 구현 간단
          - 단점: 로그아웃 어려움
          
          접근법 B: JWT + Refresh Token
          - 장점: 보안 강화, 로그아웃 가능
          - 단점: 복잡도 증가
          
          어느 것이 적합해 보이시나요?"
   
   User: "B로 하자"

4. 설계 제시 (섹션별)
   Agent: "## 아키텍처 개요
          [200-300단어 설명]
          괜찮아 보이시나요?"
   
   User: "좋아"
   
   Agent: "## 데이터 모델
          [200-300단어 설명]
          이 구조가 적절한가요?"
   
   User: "좋아"
   
   [계속...]

5. 문서 저장
   Agent: "설계를 docs/designs/2026-02-10-user-auth.md에 저장했습니다.
          진행할까요?"
   
   User: "응"

6. 자동 전환
   Agent: [using-git-worktrees 스킬 호출]
```

### 출력

```
docs/designs/2026-02-10-user-auth.md
```

---

## 주요 특징

### ✅ 해야 할 것

- 프로젝트 상태 먼저 확인
- 한 번에 하나씩 질문
- 객관식 선호
- 2-3가지 대안 제시
- 200-300단어로 섹션 나누기
- 각 섹션마다 검증
- YAGNI 적용

### ❌ 하지 말아야 할 것

- 여러 질문 동시에
- 검증 없이 진행
- 과잉 엔지니어링
- 너무 긴 설명 한 번에
- 우선순위 결정을 사용자에게 떠넘기기

---

## 최근 개선사항 (v3.1)

1. **자율적 정찰 강화**
   - 질문하기 전에 프로젝트 상태 먼저 확인

2. **추천 기반 결정**
   - 단순히 "어떤 게 좋나요?" 대신
   - "이런 이유로 A를 추천합니다. 동의하시나요?"

3. **우선순위 위임 금지**
   - 사용자에게 우선순위 결정 떠넘기지 않기
   - 제안하되 조정 가능하게

4. **자연스러운 대화**
   - 형식적 체크리스트 제거
   - 자연스러운 협업 대화로 전환

---

## 핵심 요약

**입력**: 막연한 아이디어 ("블로그 기능 추가해줘")

**프로세스**:

1. 프로젝트 탐색
2. 질문으로 명확화 (한 번에 하나씩)
3. 대안 제시 (2-3가지)
4. 설계 작성 (200-300단어 섹션)
5. 문서 저장

**출력**:

- 완전한 설계 문서 (`docs/designs/YYYY-MM-DD-<feature>.md`)
- 자동으로 다음 단계 (using-git-worktrees) 전환
