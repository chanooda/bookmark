# React Composition Patterns

확장 가능한 React 컴포지션 패턴을 위한 체계적인 저장소입니다.
이 패턴들은 복합 컴포넌트 사용, 상태 리프팅, 내부 컴포지션을 통해
부울 프로퍼티의 과도한 증가를 방지하는 데 도움이 됩니다.

## 규칙

### 컴포넌트 아키텍처 (중요)

- `architecture-avoid-boolean-props.md` - 동작 커스터마이징을 위해 부울 프로퍼티 추가 금지
- `architecture-compound-components.md` - 공유 컨텍스트를 가진 복합 컴포넌트로 구조화

### 상태 관리 (높음)

- `state-lift-state.md` - 상태를 프로바이더 컴포넌트로 리프트
- `state-context-interface.md` - 명확한 컨텍스트 인터페이스 정의
  (state/actions/meta)
- `state-decouple-implementation.md` - 상태 관리와 UI 분리

### 구현 패턴 (중요도 중간)

- `patterns-children-over-render-props.md` - renderX 프로퍼티보다 자식 요소를 우선시
- `patterns-explicit-variants.md` - 명시적 컴포넌트 변형 생성

## Core Principles

1. **설정보다 합성** — props를 추가하는 대신, 사용자가 합성하도록 하세요
2. **상태를 끌어올리세요** — 컴포넌트에 갇힌 상태가 아닌, provider에 상태를 두세요
3. **내부를 합성하세요** — 하위 컴포넌트는 props가 아닌 context에 접근하세요
4. **명시적 변형** — isThread를 가진 Composer가 아닌, ThreadComposer, EditComposer를 만드세요

## 영향 수준

- `CRITICAL` - 기초 패턴, 유지보수 불가능한 코드 방지
- `HIGH` - 상당한 유지보수성 개선
- `MEDIUM` - 더 깔끔한 코드를 위한 좋은 관행
