import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorOpen,
  HelpCircle,
  MapPin,
  MessageSquare,
  MinusCircle,
  UsersRound,
} from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { TravelBtiPageShell } from "../../components/TravelBtiPageShell";
import { ApiError, authService, authTokenStorage, tripBtiService, TripBtiQuestion } from "../../services";
import signpostIllustration from "../../../assets/travel-bti-test/travel-bti-test-side-signpost.png";
import "./index.less";

const choiceOptions = [
  { label: "强烈偏左", value: 0, icon: "double-left" },
  { label: "稍微偏左", value: 0.25, icon: "single-left" },
  { label: "中立 / 都可以", value: 0.5, icon: "neutral" },
  { label: "稍微偏右", value: 0.75, icon: "single-right" },
  { label: "强烈偏右", value: 1, icon: "double-right" },
];

const featureItems = [
  { label: "了解你的旅行偏好", icon: UsersRound },
  { label: "促进团队更好协作", icon: UsersRound },
  { label: "生成团队旅行建议", icon: BarChart3 },
];

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败，请稍后重试";
};

const getDefaultScore = (question: TripBtiQuestion) => {
  const scores = [...question.scoreValues].sort((left, right) => Math.abs(left - 0.5) - Math.abs(right - 0.5));

  return scores[0] ?? 0.5;
};

function ChoiceIcon({ type }: { type: string }) {
  if (type === "neutral") {
    return <MinusCircle size={34} strokeWidth={2.2} />;
  }

  const isLeft = type.includes("left");
  const isDouble = type.includes("double");
  const className = `choice-symbol ${isLeft ? "left" : "right"}`;

  return (
    <span className={className} aria-hidden="true">
      <ChevronRight size={34} strokeWidth={3.1} />
      {isDouble && <ChevronRight size={34} strokeWidth={3.1} />}
    </span>
  );
}

export function TravelBtiTestPage() {
  const navigate = useNavigate();
  const transitionTimerRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef(Date.now());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [questions, setQuestions] = useState<TripBtiQuestion[]>([]);
  const [versionId, setVersionId] = useState<number>();
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isChoiceLocked, setIsChoiceLocked] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.questionNo] : undefined;
  const hasCurrentAnswer = currentAnswer !== undefined;
  const availableChoiceOptions = currentQuestion
    ? choiceOptions.filter((option) => currentQuestion.scoreValues.includes(option.value))
    : choiceOptions;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progressPercent = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleLogout = async () => {
    try {
      await authService.logout();
      authTokenStorage.clear();
      window.localStorage.removeItem("teamtrip-auth-user");
      navigate("/login");
    } catch {
      // Keep the current login state when the logout API fails.
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        setErrorMessage("");

        const response = await tripBtiService.getQuestions();

        if (!isMounted) {
          return;
        }

        setQuestions(response.questions);
        setVersionId(response.versionId);
        setCurrentQuestionIndex(0);
        setAnswers({});
        startedAtRef.current = Date.now();
        window.localStorage.removeItem("teamtrip-travel-bti-answers");
        window.localStorage.removeItem("teamtrip-travel-bti-profile");

        tripBtiService.saveProgress().catch(() => {
          // Progress is only a soft hint for resume prompts.
        });
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoadingQuestions(false);
        }
      }
    };

    loadQuestions();

    return () => {
      isMounted = false;
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
      if (finishTimerRef.current) {
        window.clearTimeout(finishTimerRef.current);
      }
    };
  }, []);

  const clearTransitionTimers = () => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    if (finishTimerRef.current) {
      window.clearTimeout(finishTimerRef.current);
    }
  };

  const submitAnswers = async (nextAnswers: Record<number, number>) => {
    if (!versionId || questions.length === 0) {
      setErrorMessage("题目版本信息缺失，请刷新后重试");
      setIsChoiceLocked(false);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await tripBtiService.submitAnswers({
        versionId,
        durationSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
        answers: questions.map((question) => ({
          questionNo: question.questionNo,
          score: nextAnswers[question.questionNo] ?? 0.5,
        })),
      });

      navigate("/travel-bti/result");
    } catch (error) {
      setIsSubmitting(false);
      setIsChoiceLocked(false);
      setIsTransitioning(false);
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleSelectAnswer = (value: number) => {
    if (isChoiceLocked || !currentQuestion || isSubmitting) {
      return;
    }

    clearTransitionTimers();
    const nextAnswers = {
      ...answers,
      [currentQuestion.questionNo]: value,
    };

    setAnswers((current) => ({
      ...current,
      [currentQuestion.questionNo]: value,
    }));
    setIsChoiceLocked(true);

    transitionTimerRef.current = window.setTimeout(() => {
      setIsTransitioning(true);

      finishTimerRef.current = window.setTimeout(() => {
        if (isLastQuestion) {
          submitAnswers(nextAnswers);
          return;
        }

        setCurrentQuestionIndex((current) => current + 1);
        window.requestAnimationFrame(() => {
          setIsTransitioning(false);
          setIsChoiceLocked(false);
        });
      }, 220);
    }, 420);
  };

  const goPreviousQuestion = () => {
    if (!isFirstQuestion && !isChoiceLocked && !isSubmitting) {
      clearTransitionTimers();
      setIsChoiceLocked(true);
      setIsTransitioning(true);

      finishTimerRef.current = window.setTimeout(() => {
        setCurrentQuestionIndex((current) => current - 1);
        window.requestAnimationFrame(() => {
          setIsTransitioning(false);
          setIsChoiceLocked(false);
        });
      }, 220);
    }
  };

  const retryLoadQuestions = () => {
    setIsLoadingQuestions(true);
    setErrorMessage("");
    tripBtiService
      .getQuestions()
      .then((response) => {
        setQuestions(response.questions);
        setVersionId(response.versionId);
        setCurrentQuestionIndex(0);
        setAnswers({});
        startedAtRef.current = Date.now();
      })
      .catch((error) => setErrorMessage(getErrorMessage(error)))
      .finally(() => setIsLoadingQuestions(false));
  };

  return (
    <TravelBtiPageShell
      header={
        <AppHeader
          title="Trip-BTI 测试"
          onLogout={handleLogout}
          actions={[
            {
              label: "退出测试",
              icon: DoorOpen,
              onClick: () => navigate(-1),
              variant: "ghost",
            },
          ]}
        />
      }
    >
      <section className="travel-bti-test-layout" aria-label="Trip-BTI 旅行偏好测试">
        <article className="travel-bti-quiz-card">
          <div className="quiz-title-row">
            <h1>Trip-BTI 旅行偏好测试</h1>
          </div>

          {isLoadingQuestions || !currentQuestion ? (
            <div className="quiz-state-panel">
              <Clock3 size={28} />
              <strong>{errorMessage ? "题库加载失败" : "正在同步测试题库"}</strong>
              <p>{errorMessage || "马上就好，正在获取当前发布版本的 Trip-BTI 题目。"}</p>
              {errorMessage && (
                <button className="quiz-primary-button" type="button" onClick={retryLoadQuestions}>
                  重新加载
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="quiz-progress-meta">
                <p>
                  第 <strong>{currentQuestionIndex + 1}</strong> / {questions.length} 题
                </p>
                <span>
                  <Clock3 size={18} />
                  预计 3 分钟完成
                </span>
              </div>

              <div className="quiz-progress-track" aria-hidden="true">
                <span style={{ width: `${progressPercent}%` }} />
              </div>

              <div className={`quiz-content ${isTransitioning ? "is-switching" : ""}`}>
                <div className="quiz-question-block">
                  <p className="quiz-question">
                    你更倾向于
                    <HelpCircle size={18} />
                  </p>

                  <div className="quiz-statement-row">
                    <div className="quiz-statement left">
                      <MapPin size={52} fill="currentColor" strokeWidth={1.8} />
                      <strong>{currentQuestion.leftText}</strong>
                    </div>

                    <div className="quiz-versus" aria-hidden="true">
                      <span>VS</span>
                    </div>

                    <div className="quiz-statement right">
                      <strong>{currentQuestion.rightText}</strong>
                      <MapPin size={52} fill="currentColor" strokeWidth={1.8} />
                    </div>
                  </div>
                </div>

                <div className="quiz-choice-group" role="radiogroup" aria-label="旅行偏好选择">
                  {availableChoiceOptions.map((option) => (
                    <button
                      className={`quiz-choice ${currentAnswer === option.value ? "selected" : ""}`}
                      key={option.label}
                      type="button"
                      role="radio"
                      aria-checked={currentAnswer === option.value}
                      disabled={isChoiceLocked || isSubmitting}
                      onClick={() => handleSelectAnswer(option.value)}
                    >
                      <ChoiceIcon type={option.icon} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>

                <div className="quiz-dimension-line">
                  <MessageSquare size={18} />
                  <span>当前维度：</span>
                  <strong>
                    {currentQuestion.dimensionLabel}：{currentQuestion.leftLabel} vs {currentQuestion.rightLabel}
                  </strong>
                </div>

                {errorMessage && <p className="quiz-error-message">{errorMessage}</p>}
              </div>

              <div className="quiz-card-divider" />

              <div className="quiz-actions">
                <button
                  className="quiz-secondary-button"
                  type="button"
                  onClick={goPreviousQuestion}
                  disabled={isFirstQuestion || isChoiceLocked || isSubmitting}
                >
                  <ChevronLeft size={20} />
                  上一题
                </button>
                <button
                  className="quiz-primary-button"
                  type="button"
                  disabled={isChoiceLocked || isSubmitting}
                  onClick={() =>
                    currentAnswer === undefined ? handleSelectAnswer(getDefaultScore(currentQuestion)) : handleSelectAnswer(currentAnswer)
                  }
                >
                  {isSubmitting ? "正在生成结果" : isLastQuestion && hasCurrentAnswer ? "查看结果" : isLastQuestion ? "选择中立并完成" : "跳过本题"}
                  <ChevronRight size={20} />
                </button>
              </div>
            </>
          )}
        </article>

        <aside className="travel-bti-side-card" aria-label="Trip-BTI 测试说明">
          <img className="side-card-illustration" src={signpostIllustration} alt="" />
          <h2>发现更合拍的旅行方式</h2>
          <p>完成测试后，你将获得专属旅行画像，并用于团队画像聚合</p>
          <div className="side-card-divider" />

          <ul className="side-feature-list">
            {featureItems.map(({ label, icon: Icon }) => (
              <li key={label}>
                <span>
                  <Icon size={22} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </TravelBtiPageShell>
  );
}
