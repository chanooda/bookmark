추출물 : 세부 계획 문서 (docs/plans/YYYY-MM-DD-<feature-name>.md)

# 계획 작성하기 (Writing Plans) skill 번역

name: writing-plans
description: 스펙이나 요구사항이 있는 다단계 작업에서 코드 작성 전에 사용

## 개요

  코드베이스에 대한 컨텍스트가 전혀 없고 판단력이 의심스러운 엔지니어를 가정하고 포괄적인 구현 계획을 작성하세요. 그들이 알아야 할 모든 것을 문서화하세요:
   각 작업에서 수정할 파일, 코드, 테스트, 확인해야 할 문서, 테스트 방법. 전체 계획을 작은 단위의 작업으로 나누어 제공하세요. DRY. YAGNI. TDD. 자주 커밋.

  그들이 숙련된 개발자이지만 우리의 툴셋이나 문제 도메인에 대해 거의 모른다고 가정하세요. 좋은 테스트 설계에 대해 잘 모른다고 가정하세요.

  **시작 시 알림:** "구현 계획을 작성하기 위해 writing-plans 스킬을 사용합니다."

  **컨텍스트:** 이것은 전용 worktree에서 실행되어야 합니다

  **계획 저장 위치:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## 작은 단위 작업 세분화

  **각 단계는 하나의 행동 (2-5분):**

- "실패하는 테스트 작성" - 단계
- "실패하는지 확인하기 위해 실행" - 단계
- "테스트를 통과시키는 최소한의 코드 구현" - 단계
- "테스트 실행하고 통과하는지 확인" - 단계
- "커밋" - 단계

## 계획 문서 헤더

  **모든 계획은 반드시 이 헤더로 시작해야 합니다:**

  ```markdown
  # [기능 이름] 구현 계획

  > **Claude를 위한 메모:** 필수 서브-스킬: 이 계획을 작업별로 구현하려면 superpowers:executing-plans를 사용하세요.

  **목표:** [무엇을 만드는지 한 문장으로 설명]

  **아키텍처:** [접근 방식에 대한 2-3문장]

  **기술 스택:** [주요 기술/라이브러리]

  ---

  작업 구조

  ### 작업 N: [컴포넌트 이름]

  **파일:**
  - 생성: `exact/path/to/file.py`
  - 수정: `exact/path/to/existing.py:123-145`
  - 테스트: `tests/exact/path/to/test.py`

  **단계 1: 실패하는 테스트 작성**

  ```python
  def test_specific_behavior():
      result = function(input)
      assert result == expected

  단계 2: 테스트를 실행하여 실패하는지 확인

  실행: pytest tests/path/test.py::test_name -v
  예상 결과: FAIL with "function not defined"

  단계 3: 최소한의 구현 작성

  def function(input):
      return expected

  단계 4: 테스트를 실행하여 통과하는지 확인

  실행: pytest tests/path/test.py::test_name -v
  예상 결과: PASS

  단계 5: 커밋

  git add tests/path/test.py src/path/file.py
  git commit -m "feat: add specific feature"

  ## 기억할 것
  - 항상 정확한 파일 경로
  - 계획에 완전한 코드 포함 ("검증 추가"가 아님)
  - 예상 출력과 함께 정확한 명령어
  - @ 구문으로 관련 스킬 참조
  - DRY, YAGNI, TDD, 자주 커밋

  